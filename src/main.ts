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
import { LoggerService } from './core/logger';

export default class SemanticGardenerPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  vectorStorage!: VectorStorage;
  transactionManager!: TransactionManager;
  geminiClient!: GeminiClient;
  workerClient!: WorkerClient;
  logger: LoggerService = new LoggerService();

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
    this.workerClient = new WorkerClient(this.app, this.manifest.id, this.logger);
    await this.logger.initFileLogger(this.app, this.manifest.id);

    this.workerClient.setModelProgressListener((file, percent) => {
      const overall = 15 + Math.round((percent / 100) * 35);
      if (percent >= 100) {
        this.logger.updateProgress('Загрузка модели', overall, `Файл ${file} загружен (100%). Компиляция ONNX WebAssembly...`);
      } else {
        this.logger.updateProgress('Загрузка модели', overall, `Скачивание ${file}: ${percent}%`);
      }
    });

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
      id: 'cancel-scan',
      name: 'Cancel ongoing semantic scan',
      callback: () => this.cancelScan()
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

    this.addCommand({
      id: 'open-debug-log',
      name: 'Open debug log (debug.log)',
      callback: () => this.logger.openLogFile()
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
    this.workerClient?.terminate();
    this.vectorStorage?.close();
    this.logger.info('Semantic Gardener выгружен.');
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
    const signal = this.logger.startSession('Поиск заметок в хранилище...');
    this.scanProgress = 'Поиск заметок в vault...';
    this.notifyViews();
    await this.activateView();

    try {
      const excluded = this.settings.excludedFolders.split(',').map(s => s.trim());
      const files = getMarkdownFiles(this.app, excluded);

      if (files.length === 0) {
        this.logger.warn('В хранилище не найдено заметок для анализа.');
        new Notice('В хранилище не найдено заметок для анализа.');
        this.logger.finishSession('Заметок для анализа не найдено');
        return;
      }

      this.logger.info(`Найдено ${files.length} заметок. Нарезка структурных блоков...`);
      new Notice(`Semantic Gardener: Начало сканирования ${files.length} заметок...`);

      // 1. Chunk and extract text (0% - 15%)
      const allChunks: SemanticChunk[] = [];
      const chunksNeedingEmbedding: Array<{ id: string; text: string }> = [];

      for (let i = 0; i < files.length; i++) {
        if (signal.aborted) {
          this.logger.cancelSession();
          return;
        }

        const file = files[i];
        const phasePct = Math.round(((i + 1) / files.length) * 15);
        this.scanProgress = `Нарезка AST (${i + 1}/${files.length}): ${file.basename}`;
        this.logger.updateProgress('Нарезка AST', phasePct, this.scanProgress);
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

      this.logger.info(`Нарезка завершена: ${allChunks.length} блоков. Из кэша: ${allChunks.length - chunksNeedingEmbedding.length}, новых: ${chunksNeedingEmbedding.length}.`);

      if (signal.aborted) {
        this.logger.cancelSession();
        return;
      }

      // 2. Generate missing embeddings in Web Worker (15% - 70%)
      if (chunksNeedingEmbedding.length > 0) {
        this.scanProgress = `Векторизация ${chunksNeedingEmbedding.length} фрагментов...`;
        this.logger.updateProgress('Векторизация', 15, this.scanProgress);
        this.notifyViews();

        const embeddingMap = await this.workerClient.embedBatch(
          chunksNeedingEmbedding,
          8,
          (done, total) => {
            const batchPct = 15 + Math.round((done / total) * 55);
            this.scanProgress = `Векторизация: ${done}/${total} блоков (${Math.round((done / total) * 100)}%)`;
            this.logger.updateProgress('Векторизация', batchPct, this.scanProgress);
            this.notifyViews();
          },
          signal
        );

        if (signal.aborted) {
          this.logger.cancelSession();
          return;
        }

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
          this.logger.info(`Сохранено ${toSave.length} новых эмбеддингов в IndexedDB.`);
        }
      } else {
        this.logger.updateProgress('Векторизация', 70, 'Все фрагменты уже содержатся в кэше.');
      }

      if (signal.aborted) {
        this.logger.cancelSession();
        return;
      }

      // 3. Cluster Candidates by Cosine Similarity (70% - 80%)
      this.scanProgress = 'Поиск семантических дубликатов и кластеризация...';
      this.logger.updateProgress('Кластеризация', 75, this.scanProgress);
      this.notifyViews();

      this.candidateClusters = findCandidateClusters(allChunks, this.settings.similarityThreshold);

      if (this.candidateClusters.length === 0) {
        this.logger.finishSession('Семантических дубликатов с заданным порогом сходства не обнаружено.');
        new Notice('Семантических дубликатов с заданным порогом сходства не обнаружено.');
        this.scanProgress = '';
        return;
      }

      this.logger.success(`Найдено ${this.candidateClusters.length} кандидатов на рефакторинг.`);
      new Notice(`Найдено ${this.candidateClusters.length} кандидатов на рефакторинг. Запуск LLM Gatekeeper...`);

      // 4. Validate with Gemini Gatekeeper if API key is provided (80% - 100%)
      if (this.settings.geminiApiKey) {
        this.logger.info('Запуск анализа LLM Gatekeeper...');
        for (let i = 0; i < this.candidateClusters.length; i++) {
          if (signal.aborted) {
            this.logger.cancelSession();
            return;
          }

          const cluster = this.candidateClusters[i];
          const gatekeeperPct = 80 + Math.round(((i + 1) / this.candidateClusters.length) * 20);
          this.scanProgress = `LLM Gatekeeper (${i + 1}/${this.candidateClusters.length}): Анализ кластера...`;
          this.logger.updateProgress('LLM Gatekeeper', gatekeeperPct, this.scanProgress);
          this.notifyViews();

          const clusterNumber = `#${i + 1}`;
          const sampleName = cluster.chunks[0]?.filePath?.split('/').pop()?.replace(/\.md$/, '') || '';
          const clusterLabel = `Кластер ${clusterNumber} ("${sampleName}")`;

          try {
            const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
            this.refactorPlans[cluster.id] = plan;
            if (plan.isDuplicate) {
              this.logger.success(`${clusterLabel} одобрен: концепт "${plan.conceptTitle}".`);
            } else {
              this.logger.info(`[Отклонен] ${clusterLabel}: ${plan.rejectionReason || 'Нет дублирования'}.`);
            }
          } catch (aiErr: any) {
            console.error(`AI Analysis error for cluster ${cluster.id}:`, aiErr);
            this.logger.error(`Ошибка AI для ${clusterLabel}: ${aiErr.message}`);
          }

          // Rate-limiting delay (1.5s) to stay within Gemini free-tier RPM and token limits
          if (i < this.candidateClusters.length - 1 && !signal.aborted) {
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      } else {
        this.logger.warn('API-ключ Gemini не задан. Автоматическая генерация замен пропущена.');
        new Notice('Укажите Gemini API-ключ в настройках для автоматической генерации микрохирургических замен.');
      }

      this.scanProgress = '';
      this.logger.finishSession(`Сканирование завершено! Доступно ${this.candidateClusters.length} концептов.`);
      new Notice(`Сканирование завершено! Доступно ${this.candidateClusters.length} концептов для ревизии.`);
    } catch (err: any) {
      if (signal.aborted) {
        this.logger.cancelSession();
      } else {
        console.error('Semantic Gardener scan error:', err);
        const stack = err?.stack || String(err);
        this.logger.error(`Ошибка при сканировании: ${err?.message || err}`, stack);
        new Notice(`Ошибка при сканировании: ${err?.message || err}`);
      }
    } finally {
      this.isScanning = false;
      this.scanProgress = '';
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

    if (this.isScanning) {
      new Notice('Сканирование уже выполняется...');
      return;
    }

    this.isScanning = true;
    const signal = this.logger.startSession(`Анализ заметки: ${activeFile.basename}...`);
    this.scanProgress = `Анализ активной заметки: ${activeFile.basename}...`;
    this.notifyViews();
    await this.activateView();

    try {
      this.logger.updateProgress('Анализ заметки', 15, `Чтение ${activeFile.basename}...`);
      const activeContent = await this.app.vault.read(activeFile);
      const activeChunks = await chunkMarkdown(activeFile.path, activeContent, {
        minChunkLength: this.settings.minChunkLength
      });

      if (activeChunks.length === 0) {
        this.logger.warn('В активной заметке нет подходящих текстовых фрагментов.');
        new Notice('В активной заметке нет подходящих текстовых фрагментов.');
        this.logger.finishSession('Нет подходящих фрагментов');
        return;
      }

      if (signal.aborted) {
        this.logger.cancelSession();
        return;
      }

      // Check/generate embeddings for active note (15% - 60%)
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
        this.logger.updateProgress('Векторизация', 30, `Векторизация ${needingEmbedding.length} фрагментов...`);
        const map = await this.workerClient.embedBatch(needingEmbedding, 8, undefined, signal);
        const toSave: SemanticChunk[] = [];
        for (const chunk of activeChunks) {
          if (!chunk.embedding && map.has(chunk.id)) {
            chunk.embedding = map.get(chunk.id);
            toSave.push(chunk);
          }
        }
        await this.vectorStorage.saveChunks(toSave);
      }

      if (signal.aborted) {
        this.logger.cancelSession();
        return;
      }

      // Load all other vault chunks from database (60% - 75%)
      this.logger.updateProgress('Поиск связей', 65, 'Сравнение с базой знаний...');
      const allIndexed = await this.vectorStorage.getAllChunksWithEmbeddings();
      const combined = [...allIndexed];
      for (const ac of activeChunks) {
        if (!combined.some(c => c.id === ac.id)) {
          combined.push(ac);
        }
      }

      this.candidateClusters = findClustersForNote(activeFile.path, combined, this.settings.similarityThreshold);

      if (this.candidateClusters.length === 0) {
        this.logger.finishSession(`Дубликатов для заметки "${activeFile.basename}" не найдено.`);
        new Notice(`Дубликатов для заметки "${activeFile.basename}" не найдено.`);
      } else {
        this.logger.success(`Найдено ${this.candidateClusters.length} совпадений.`);
        new Notice(`Найдено ${this.candidateClusters.length} совпадений для "${activeFile.basename}".`);

        if (this.settings.geminiApiKey) {
          this.logger.info('Анализ совпадений через Gemini Gatekeeper...');
          for (let i = 0; i < this.candidateClusters.length; i++) {
            if (signal.aborted) {
              this.logger.cancelSession();
              return;
            }
            const cluster = this.candidateClusters[i];
            const pct = 75 + Math.round(((i + 1) / this.candidateClusters.length) * 25);
            this.logger.updateProgress('LLM Gatekeeper', pct, `Анализ кластера ${i + 1}/${this.candidateClusters.length}...`);

            const clusterNumber = `#${i + 1}`;
            const sampleName = cluster.chunks[0]?.filePath?.split('/').pop()?.replace(/\.md$/, '') || '';
            const clusterLabel = `Кластер ${clusterNumber} ("${sampleName}")`;

            try {
              const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
              this.refactorPlans[cluster.id] = plan;
              if (plan.isDuplicate) {
                this.logger.success(`${clusterLabel} одобрен: концепт "${plan.conceptTitle}".`);
              } else {
                this.logger.info(`[Отклонен] ${clusterLabel}: ${plan.rejectionReason || 'Нет дублирования'}.`);
              }
            } catch (aiErr: any) {
              console.error('Active note AI error:', aiErr);
              this.logger.error(`Ошибка AI для ${clusterLabel}: ${aiErr.message}`);
            }

            // Rate-limiting delay between requests
            if (i < this.candidateClusters.length - 1 && !signal.aborted) {
              await new Promise(r => setTimeout(r, 1500));
            }
          }
        }
        this.logger.finishSession(`Анализ завершен. Доступно ${this.candidateClusters.length} кандидатов.`);
      }
    } catch (err: any) {
      if (signal.aborted) {
        this.logger.cancelSession();
      } else {
        console.error('Active note scan error:', err);
        const stack = err?.stack || String(err);
        this.logger.error(`Ошибка при анализе активной заметки: ${err?.message || err}`, stack);
        new Notice(`Ошибка: ${err?.message || err}`);
      }
    } finally {
      this.isScanning = false;
      this.scanProgress = '';
      this.notifyViews();
    }
  }

  cancelScan(): void {
    if (this.isScanning) {
      this.logger.cancelSession();
      this.isScanning = false;
      this.scanProgress = '';
      this.notifyViews();
      new Notice('Сканирование остановлено пользователем.');
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

  /**
   * Evaluates a single cluster on demand (e.g. if skipped or failed earlier due to rate limit).
   */
  async analyzeCluster(cluster: CandidateCluster): Promise<RefactorPlan | null> {
    if (!this.settings.geminiApiKey) {
      new Notice('Укажите Gemini API-ключ в настройках плагина.');
      return null;
    }
    try {
      this.logger.info(`Запуск точечного AI-анализа для концепта...`);
      const plan = await this.geminiClient.validateAndRefactorCluster(cluster);
      this.refactorPlans[cluster.id] = plan;
      if (plan.isDuplicate) {
        this.logger.success(`Концепт "${plan.conceptTitle}" успешно подтвержден AI.`);
      } else {
        this.logger.info(`[Отклонен] Концепт: ${plan.rejectionReason || 'Нет дублирования'}.`);
      }
      this.notifyViews();
      return plan;
    } catch (err: any) {
      console.error('Single cluster analysis error:', err);
      this.logger.error(`Ошибка AI при анализе концепта: ${err?.message || err}`);
      new Notice(`Ошибка AI: ${err?.message || err}`);
      return null;
    }
  }

  rejectCluster(clusterId: string): void {
    this.candidateClusters = this.candidateClusters.filter(c => c.id !== clusterId);
    delete this.refactorPlans[clusterId];
    this.notifyViews();
    new Notice('Концепт отклонен и удален из очереди.');
  }
}
