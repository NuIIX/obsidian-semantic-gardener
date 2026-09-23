import { App, Notice } from 'obsidian';
import { WorkerInMessage, WorkerOutMessage } from '../types';

export type ProgressCallback = (done: number, total: number) => void;

export class WorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (val: any) => void;
    reject: (err: Error) => void;
  }>();
  private isReady = false;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private app: App;
  private pluginId: string;

  constructor(app: App, pluginId: string = 'obsidian-semantic-gardener') {
    this.app = app;
    this.pluginId = pluginId;
  }

  async init(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;

      try {
        this.spawnWorker();
      } catch (err: any) {
        reject(err);
      }
    });

    return this.readyPromise;
  }

  private async spawnWorker(): Promise<void> {
    try {
      // 1. Try reading the bundled worker.js directly from plugin folder
      const workerFilePath = `.obsidian/plugins/${this.pluginId}/worker.js`;
      let workerUrl: string;

      if (await this.app.vault.adapter.exists(workerFilePath)) {
        const workerCode = await this.app.vault.adapter.read(workerFilePath);
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(blob);
      } else {
        // Fallback to direct path or relative path
        workerUrl = 'worker.js';
      }

      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (err) => {
        console.error('Semantic Gardener: Web Worker error:', err);
        new Notice('Semantic Gardener: Ошибка Web Worker векторизации.');
      };

      // Send INIT signal
      const initMsg: WorkerInMessage = { type: 'INIT' };
      this.worker.postMessage(initMsg);
    } catch (err: any) {
      console.error('Semantic Gardener: Failed to spawn Web Worker:', err);
      new Notice(`Semantic Gardener: Не удалось запустить фоновый Web Worker: ${err.message}`);
      throw err;
    }
  }

  private handleWorkerMessage(msg: WorkerOutMessage) {
    if (msg.type === 'READY') {
      this.isReady = true;
      if (this.readyResolve) {
        this.readyResolve();
        this.readyResolve = null;
      }
      return;
    }

    if (msg.type === 'EMBED_COMPLETE') {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        this.pendingRequests.delete(msg.id);
        const map = new Map<string, Float32Array>();
        for (const res of msg.results) {
          map.set(res.id, res.embedding);
        }
        pending.resolve(map);
      }
      return;
    }

    if (msg.type === 'ERROR') {
      if (msg.id) {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          this.pendingRequests.delete(msg.id);
          pending.reject(new Error(msg.error));
        }
      } else {
        console.error('Semantic Gardener Worker general error:', msg.error);
      }
    }
  }

  /**
   * Generates embeddings in batches to keep UI responsive and report progress.
   */
  async embedBatch(
    items: Array<{ id: string; text: string }>,
    batchSize: number = 8,
    onProgress?: ProgressCallback
  ): Promise<Map<string, Float32Array>> {
    await this.init();

    const overallResults = new Map<string, Float32Array>();
    const total = items.length;
    let completed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const slice = items.slice(i, i + batchSize);
      const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const batchMap = await new Promise<Map<string, Float32Array>>((resolve, reject) => {
        this.pendingRequests.set(reqId, { resolve, reject });
        const msg: WorkerInMessage = {
          type: 'EMBED_BATCH',
          id: reqId,
          items: slice
        };
        this.worker!.postMessage(msg);
      });

      for (const [id, emb] of batchMap.entries()) {
        overallResults.set(id, emb);
      }

      completed += slice.length;
      if (onProgress) {
        onProgress(Math.min(completed, total), total);
      }
    }

    return overallResults;
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.readyPromise = null;
    }
  }
}
