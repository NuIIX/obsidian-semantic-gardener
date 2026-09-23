import { Plugin, TFile, WorkspaceLeaf, Notice, normalizePath } from 'obsidian';
import { DEFAULT_SETTINGS } from './types';
import type { PluginSettings, CandidateCluster, RefactorPlan, SemanticChunk, RefactorModification } from './types';
import { SemanticGardenerSettingTab } from './settings';
import { RefactorView, VIEW_TYPE_REFACTOR } from './ui/RefactorView';
import { VectorStorage } from './storage/indexed-db';
import { TransactionManager } from './storage/transaction-manager';
import type { MutationRequest } from './storage/transaction-manager';
import { GeminiClient } from './ai/gemini-client';
import { WorkerClient } from './ai/worker-client';
import { chunkMarkdown } from './core/chunker';
import { findCandidateClusters, findClustersForNote } from './ai/vector-search';
import { getMarkdownFiles, ensureFolderExists, sanitizeNoteTitle } from './utils/vault-mutator';

export default class SemanticGardenerPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  vectorStorage!: VectorStorage;
  transactionManager!: TransactionManager;
  geminiClient!: GeminiClient;
  workerClient!: WorkerClient;

  candidateClusters: CandidateCluster[] = [];
  refactorPlans: Record<string, RefactorPlan> = {};
  isScanning: boolean = false;
  scanProgress: string = '';

  async onload() {
    await this.loadSettings();

    // 1. Initialize Storage & AI Clients
    this.vectorStorage = new VectorStorage();
    this.transactionManager = new TransactionManager(this.app, this.manifest.id, this.settings.maxHistoryLength);
    await this.transactionManager.init();

    this.geminiClient = new GeminiClient(this.settings.geminiApiKey, this.settings.geminiModel);
    this.workerClient = new WorkerClient(this.app, this.manifest.id);

    // 2. Register Review View
    this.registerView(
      VIEW_TYPE_REFACTOR,
      (leaf: WorkspaceLeaf) => new RefactorView(leaf, this)
    );

    // 3. Register Ribbon Icon
    this.addRibbonIcon('sprout', 'Semantic Gardener', () => {
      this.activateView();
    });

    // 4. Register Commands
    this.addCommand({
      id: 'scan-vault',
      name: 'Scan vault for semantic duplicates',
      callback: () => this.scanVault()
    });

    this.addCommand({
      id: 'scan-active-note',
      name: 'Find duplicates for active note',
      callback: () => this.scanActiveNote()
    });

    this.addCommand({
      id: 'open-review',
      name: 'Open review view',
      callback: () => this.activateView()
    });

    this.addCommand({
      id: 'undo-last',
      name: 'Undo last refactor',
      callback: () => this.transactionManager.undoLast()
    });

    // 5. Register Settings Tab
    this.addSettingTab(new SemanticGardenerSettingTab(this.app, this));

    // 6. Listen to Vault Events for incremental cache invalidation
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
          this.vectorStorage.deleteFile(file.path);
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (file instanceof TFile) {
          this.vectorStorage.deleteFile(oldPath);
        }
      })
    );
  }

  onunload() {
    this.workerClient.terminate();
    this.vectorStorage.close();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_REFACTOR)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: VIEW_TYPE_REFACTOR, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  notifyViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REFACTOR);
    for (const leaf of leaves) {
      if (leaf.view instanceof RefactorView) {
        leaf.view.updateProps();
      }
    }
  }

  /**
   * Scans all markdown notes in the vault, computes missing embeddings,
   * clusters duplicates, and runs Gatekeeper validation.
   */
  async scanVault(): Promise<void> {
    if (this.isScanning) {
      new Notice('Сканирование уже выполняется...');
      return;
    }

    this.isScanning = true;
    this.scanProgress = 'Поиск заметок в vault...';
    this.notifyViews();
    await this.activateView();

    try {
      const excluded = this.settings.excludedFolders.split(',').map(s => s.trim());
      const files = getMarkdownFiles(this.app, excluded);

      if (files.length === 0) {
        new Notice('В хранилище не найдено заметок для анализа.');
        this.isScanning = false;
        this.notifyViews();
        return;
      }

      new Notice(`Semantic Gardener: Начало сканирования ${files.length} заметок...`);

      // 1. Chunk and extract text
      const allChunks: SemanticChunk[] = [];
      const chunksNeedingEmbedding: Array<{ id: string; text: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.scanProgress = `Нарезка AST (${i + 1}/${files.length}): ${file.basename}`;
        this.notifyViews();

        const content = await this.app.vault.read(file);
        const fileChunks = await chunkMarkdown(file.path, content, {
          minChunkLength: this.settings.minChunkLength
        });

        // Check cache for each chunk
        for (const chunk of fileChunks) {
          const cached = await this.vectorStorage.getChunk(chunk.id);
          if (cached && cached.embedding) {
            chunk.embedding = cached.embedding;
          } else {
            chunksNeedingEmbedding.push({ id: chunk.id, text: chunk.fullContext });
          }
          allChunks.push(chunk);
        }
      }

      // 2. Generate missing embeddings in Web Worker
      if (chunksNeedingEmbedding.length > 0) {
        this.scanProgress = `Векторизация ${chunksNeedingEmbedding.length} фрагментов...`;
        this.notifyViews();

        const embeddingMap = await this.workerClient.embedBatch(
          chunksNeedingEmbedding,
          8,
          (done, total) => {
            this.scanProgress = `Векторизация: ${done}/${total} блоков (${Math.round((done / total) * 100)}%)`;
            this.notifyViews();
          }
        );

        // Update chunks with generated embeddings and persist
        const toSave: SemanticChunk[] = [];
        for (const chunk of allChunks) {
          if (!chunk.embedding && embeddingMap.has(chunk.id)) {
            chunk.embedding = embeddingMap.get(chunk.id);
            toSave.push(chunk);
          }
        }

        if (toSave.length > 0) {
          await this.vectorStorage.saveChunks(toSave);
        }
      }

      // 3. Cluster Candidates by Cosine Similarity
      this.scanProgress = 'Поиск семантических дубликатов и кластеризация...';
      this.notifyViews();

      this.candidateClusters = findCandidateClusters(allChunks, this.settings.similarityThreshold);

      if (this.candidateClusters.length === 0) {
        new Notice('Семантических дубликатов с заданным порогом сходства не обнаружено.');
        this.isScanning = false;
        this.scanProgress = '';
        this.notifyViews();
        return;
      }

      new Notice(`Найдено ${this.candidateClusters.length} кандидатов на рефакторинг. Запуск LLM Gatekeeper...`);

      // 4. Validate with Gemini Gatekeeper if API key is provided
      if (this.settings.geminiApiKey) {
        for (let i = 0; i < this.candidateClusters.length; i++) {
          const cluster = this.candidateClusters[i];
          this.scanProgress = `LLM Gatekeeper (${i + 1}/${this.candidateClusters.length}): Анализ кластера...`;
          this.notifyViews();

          try {
            const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
            this.refactorPlans[cluster.id] = plan;
          } catch (aiErr: any) {
            console.error(`AI Analysis error for cluster ${cluster.id}:`, aiErr);
          }
        }
      } else {
        new Notice('Укажите Gemini API-ключ в настройках для автоматической генерации микрохирургических замен.');
      }

      this.scanProgress = '';
      new Notice(`Сканирование завершено! Доступно ${this.candidateClusters.length} концептов для ревизии.`);
    } catch (err: any) {
      console.error('Semantic Gardener scan error:', err);
      new Notice(`Ошибка при сканировании: ${err.message}`);
    } finally {
      this.isScanning = false;
      this.notifyViews();
    }
  }

  /**
   * Scans specifically for duplicates of the currently opened active note.
   */
  async scanActiveNote(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice('Нет открытой активной заметки.');
      return;
    }

    this.isScanning = true;
    this.scanProgress = `Анализ активной заметки: ${activeFile.basename}...`;
    this.notifyViews();
    await this.activateView();

    try {
      const activeContent = await this.app.vault.read(activeFile);
      const activeChunks = await chunkMarkdown(activeFile.path, activeContent, {
        minChunkLength: this.settings.minChunkLength
      });

      if (activeChunks.length === 0) {
        new Notice('В активной заметке нет подходящих текстовых фрагментов.');
        this.isScanning = false;
        this.notifyViews();
        return;
      }

      // Check/generate embeddings for active note
      const needingEmbedding: Array<{ id: string; text: string }> = [];
      for (const chunk of activeChunks) {
        const cached = await this.vectorStorage.getChunk(chunk.id);
        if (cached && cached.embedding) {
          chunk.embedding = cached.embedding;
        } else {
          needingEmbedding.push({ id: chunk.id, text: chunk.fullContext });
        }
      }

      if (needingEmbedding.length > 0) {
        const map = await this.workerClient.embedBatch(needingEmbedding);
        const toSave: SemanticChunk[] = [];
        for (const chunk of activeChunks) {
          if (!chunk.embedding && map.has(chunk.id)) {
            chunk.embedding = map.get(chunk.id);
            toSave.push(chunk);
          }
        }
        await this.vectorStorage.saveChunks(toSave);
      }

      // Load all other vault chunks from database
      const allIndexed = await this.vectorStorage.getAllChunksWithEmbeddings();
      const combined = [...allIndexed];
      for (const ac of activeChunks) {
        if (!combined.some(c => c.id === ac.id)) {
          combined.push(ac);
        }
      }

      this.candidateClusters = findClustersForNote(activeFile.path, combined, this.settings.similarityThreshold);

      if (this.candidateClusters.length === 0) {
        new Notice(`Дубликатов для заметки "${activeFile.basename}" не найдено.`);
      } else {
        new Notice(`Найдено ${this.candidateClusters.length} совпадений для "${activeFile.basename}".`);

        if (this.settings.geminiApiKey) {
          for (const cluster of this.candidateClusters) {
            try {
              const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
              this.refactorPlans[cluster.id] = plan;
            } catch (aiErr: any) {
              console.error('Active note AI error:', aiErr);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Active note scan error:', err);
      new Notice(`Ошибка: ${err.message}`);
    } finally {
      this.isScanning = false;
      this.scanProgress = '';
      this.notifyViews();
    }
  }

  /**
   * Applies the approved refactor plan atomically with transaction snapshot.
   */
  async applyRefactorPlan(cluster: CandidateCluster, plan: RefactorPlan): Promise<void> {
    if (!plan.conceptTitle || plan.conceptTitle.trim().length === 0) {
      new Notice('Укажите название канонической заметки.');
      return;
    }

    const safeTitle = sanitizeNoteTitle(plan.conceptTitle);
    const targetFolder = normalizePath(this.settings.conceptsFolder || 'Concepts');
    await ensureFolderExists(this.app, targetFolder);
    const newNotePath = `${targetFolder}/${safeTitle}.md`;

    const noteContent = plan.canonicalNoteMarkdown || `# ${safeTitle}\n\nОпределение концепции...`;

    const mutations: MutationRequest[] = [];
    for (const mod of plan.modifications) {
      const file = this.app.vault.getAbstractFileByPath(mod.filePath);
      if (file instanceof TFile) {
        const newSpan = 
          mod.selectedMode === 'inline'
            ? mod.suggestedInlineSpan
            : mod.selectedMode === 'transclusion'
              ? mod.transclusionSpan
              : mod.originalSpan;

        mutations.push({
          file,
          originalSpan: mod.originalSpan,
          newSpan,
          mode: mod.selectedMode
        });
      }
    }

    const res = await this.transactionManager.applyRefactor(
      safeTitle,
      newNotePath,
      noteContent,
      mutations
    );

    if (res.success) {
      // Remove applied cluster from queue
      this.candidateClusters = this.candidateClusters.filter(c => c.id !== cluster.id);
      delete this.refactorPlans[cluster.id];
      this.notifyViews();
    }
  }

  rejectCluster(clusterId: string): void {
    this.candidateClusters = this.candidateClusters.filter(c => c.id !== clusterId);
    delete this.refactorPlans[clusterId];
    this.notifyViews();
    new Notice('Концепт отклонен и удален из очереди.');
  }
}
