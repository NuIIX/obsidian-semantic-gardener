import { App, TFile, normalizePath, EventRef } from 'obsidian';
import { VectorStorage } from '../storage/indexed-db';
import { WorkerClient } from '../ai/worker-client';
import { LoggerService } from './logger';
import { chunkMarkdown } from './chunker';
import type { PluginSettings, SemanticChunk } from '../types';

export class VaultWatcher {
  private app: App;
  private vectorStorage: VectorStorage;
  private workerClient: WorkerClient;
  private logger: LoggerService;
  private getSettings: () => PluginSettings;
  private eventRef: EventRef | null = null;
  private debounceTimers: Map<string, any> = new Map();
  private isProcessing: boolean = false;
  private queue: Set<string> = new Set();

  constructor(
    app: App,
    vectorStorage: VectorStorage,
    workerClient: WorkerClient,
    logger: LoggerService,
    getSettings: () => PluginSettings
  ) {
    this.app = app;
    this.vectorStorage = vectorStorage;
    this.workerClient = workerClient;
    this.logger = logger;
    this.getSettings = getSettings;
  }

  start(): void {
    if (this.eventRef) return;

    this.eventRef = this.app.vault.on('modify', (file) => {
      if (!(file instanceof TFile) || !file.path.endsWith('.md')) {
        return;
      }

      const settings = this.getSettings();
      if (!settings.autoWatchVault) {
        return;
      }

      // Skip excalidraw drawings and excluded folders
      if (file.name.endsWith('.excalidraw.md') || file.path.endsWith('.excalidraw.md')) {
        return;
      }

      const normalized = normalizePath(file.path);
      const excluded = (settings.excludedFolders || '')
        .split(',')
        .map(s => normalizePath(s.trim()))
        .filter(s => s.length > 0);

      for (const ex of excluded) {
        if (normalized.startsWith(ex)) {
          return;
        }
      }

      this.scheduleIndex(file.path);
    });
  }

  stop(): void {
    if (this.eventRef) {
      this.app.vault.offref(this.eventRef);
      this.eventRef = null;
    }
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.queue.clear();
  }

  private scheduleIndex(filePath: string): void {
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.queue.add(filePath);
      this.processQueue();
    }, 2500);

    this.debounceTimers.set(filePath, timer);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) {
      return;
    }

    this.isProcessing = true;
    try {
      const paths = Array.from(this.queue);
      this.queue.clear();

      for (const filePath of paths) {
        await this.indexSingleFile(filePath);
      }
    } catch (err: any) {
      this.logger.error(`[VaultWatcher] Ошибка фоновой индексации: ${err?.message || err}`);
    } finally {
      this.isProcessing = false;
      if (this.queue.size > 0) {
        this.processQueue();
      }
    }
  }

  private async indexSingleFile(filePath: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!(file instanceof TFile)) {
      return;
    }

    const settings = this.getSettings();
    const content = await this.app.vault.read(file);
    const fileChunks = await chunkMarkdown(file.path, content, {
      minChunkLength: settings.minChunkLength
    });

    const chunksToEmbed: SemanticChunk[] = [];
    const completeChunks: SemanticChunk[] = [];

    for (const chunk of fileChunks) {
      const cached = await this.vectorStorage.getChunk(chunk.id);
      if (cached && cached.embedding) {
        chunk.embedding = cached.embedding;
        completeChunks.push(chunk);
      } else {
        chunksToEmbed.push(chunk);
      }
    }

    if (chunksToEmbed.length > 0) {
      const batchItems = chunksToEmbed.map(c => ({ id: c.id, text: c.fullContext }));
      const embeddings = await this.workerClient.embedBatch(batchItems);

      for (let i = 0; i < chunksToEmbed.length; i++) {
        chunksToEmbed[i].embedding = embeddings[i];
        completeChunks.push(chunksToEmbed[i]);
      }

      await this.vectorStorage.saveChunks(completeChunks);
      this.logger.info(`[VaultWatcher] Инкрементально синхронизирован "${file.basename}": векторизовано ${chunksToEmbed.length} новых фрагментов.`);
    }
  }
}
