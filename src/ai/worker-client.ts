import { App, Notice } from 'obsidian';
import { WorkerInMessage, WorkerOutMessage } from '../types';
import type { LoggerService } from '../core/logger';

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
  private readyReject: ((err: Error) => void) | null = null;
  private initTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private app: App;
  private pluginId: string;
  private logger?: LoggerService;
  private onModelProgressListener: ((file: string, progress: number) => void) | null = null;

  constructor(
    app: App,
    pluginId: string = 'obsidian-semantic-gardener',
    logger?: LoggerService
  ) {
    this.app = app;
    this.pluginId = pluginId;
    this.logger = logger;
  }

  setModelProgressListener(listener: ((file: string, progress: number) => void) | null) {
    this.onModelProgressListener = listener;
  }

  async init(): Promise<void> {
    if (this.isReady) return;
    if (this.readyPromise) return this.readyPromise;

    this.logger?.info('Инициализация фонового Web Worker для векторизации...');

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;

      // Start with a 120s inactivity watchdog timer (refreshed on every progress update)
      this.resetInitTimeout(120000);

      this.spawnWorker().catch((err: any) => {
        this.failInit(err);
      });
    });

    return this.readyPromise;
  }

  private resetInitTimeout(timeoutMs: number = 120000): void {
    if (this.initTimeoutTimer !== null) {
      clearTimeout(this.initTimeoutTimer);
      this.initTimeoutTimer = null;
    }
    this.initTimeoutTimer = setTimeout(() => {
      if (!this.isReady) {
        const timeoutErr = new Error(
          `Таймаут ожидания Web Worker (${Math.round(timeoutMs / 1000)} сек без активности). Загрузка модели HuggingFace или компиляция WebAssembly зависла. Проверьте соединение или debug.log.`
        );
        this.logger?.error(`Таймаут инициализации Web Worker (${Math.round(timeoutMs / 1000)} сек)`, timeoutErr.stack);
        this.failInit(timeoutErr);
      }
    }, timeoutMs);
  }

  private failInit(err: Error): void {
    if (this.initTimeoutTimer !== null) {
      clearTimeout(this.initTimeoutTimer);
      this.initTimeoutTimer = null;
    }
    const reject = this.readyReject;
    this.readyResolve = null;
    this.readyReject = null;
    this.readyPromise = null;
    this.isReady = false;
    if (reject) {
      reject(err);
    }
  }

  private async spawnWorker(): Promise<void> {
    try {
      const configDir = (this.app?.vault as any)?.configDir || '.obsidian';
      const workerFilePath = `${configDir}/plugins/${this.pluginId}/worker.js`;
      let workerUrl: string;

      if (await this.app.vault.adapter.exists(workerFilePath)) {
        const workerCode = await this.app.vault.adapter.read(workerFilePath);
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(blob);
        this.logger?.info(`Web Worker успешно считан из файла: ${workerFilePath} (${Math.round(workerCode.length / 1024)} KB)`);
      } else {
        workerUrl = 'worker.js';
        this.logger?.warn(`Файл worker.js не найден по пути ${workerFilePath}, используется относительный URL.`);
      }

      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (err: any) => {
        const msg = typeof err === 'string' ? err : (err?.message || 'Web Worker runtime failure');
        const details = `Worker crash at ${err?.filename || 'worker'}:${err?.lineno || '?'}:${err?.colno || '?'}\nStack: ${err?.error?.stack || 'N/A'}`;
        this.logger?.error(`Web Worker аварийно завершился: ${msg}`, details);
        console.error('Semantic Gardener: Web Worker error:', err);
        new Notice(`Semantic Gardener: Сбой Web Worker: ${msg}`);

        if (!this.isReady) {
          this.failInit(new Error(`Web Worker runtime crash: ${msg}`));
        }
        for (const [, req] of this.pendingRequests.entries()) {
          req.reject(new Error(`Web Worker crashed: ${msg}`));
        }
        this.pendingRequests.clear();
      };

      // Send INIT signal
      const initMsg: WorkerInMessage = { type: 'INIT' };
      this.worker.postMessage(initMsg);
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.logger?.error(`Не удалось запустить Web Worker: ${msg}`, err?.stack);
      console.error('Semantic Gardener: Failed to spawn Web Worker:', err);
      new Notice(`Semantic Gardener: Не удалось запустить фоновый Web Worker: ${msg}`);
      throw err;
    }
  }

  private handleWorkerMessage(msg: WorkerOutMessage) {
    if (msg.type === 'READY') {
      this.isReady = true;
      if (this.initTimeoutTimer !== null) {
        clearTimeout(this.initTimeoutTimer);
        this.initTimeoutTimer = null;
      }
      this.logger?.info('Web Worker успешно готов к векторизации.');
      if (this.readyResolve) {
        this.readyResolve();
        this.readyResolve = null;
        this.readyReject = null;
      }
      return;
    }

    if (msg.type === 'MODEL_DOWNLOAD_PROGRESS') {
      // Refresh inactivity watchdog timer on every progress tick.
      // If download finished (progress >= 100), grant 180s for WebAssembly compilation
      const extraTime = msg.progress >= 100 ? 180000 : 120000;
      this.resetInitTimeout(extraTime);

      if (this.onModelProgressListener) {
        this.onModelProgressListener(msg.file, msg.progress);
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
      this.logger?.error(`Web Worker вернул ошибку: ${msg.error}`);
      if (msg.id) {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          this.pendingRequests.delete(msg.id);
          pending.reject(new Error(msg.error));
        }
      } else {
        console.error('Semantic Gardener Worker general error:', msg.error);
        if (!this.isReady) {
          this.failInit(new Error(`Ошибка инициализации Web Worker: ${msg.error}`));
        }
      }
    }
  }

  /**
   * Generates embeddings in batches to keep UI responsive and report progress.
   */
  async embedBatch(
    items: Array<{ id: string; text: string }>,
    batchSize: number = 8,
    onProgress?: ProgressCallback,
    abortSignal?: AbortSignal
  ): Promise<Map<string, Float32Array>> {
    await this.init();

    const overallResults = new Map<string, Float32Array>();
    const total = items.length;
    let completed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      if (abortSignal?.aborted) {
        throw new Error('Операция отменена пользователем');
      }

      const slice = items.slice(i, i + batchSize);
      const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const batchMap = await new Promise<Map<string, Float32Array>>((resolve, reject) => {
        const onAbort = () => {
          this.pendingRequests.delete(reqId);
          reject(new Error('Операция отменена пользователем'));
        };

        if (abortSignal) {
          abortSignal.addEventListener('abort', onAbort, { once: true });
        }

        this.pendingRequests.set(reqId, {
          resolve: (val) => {
            if (abortSignal) abortSignal.removeEventListener('abort', onAbort);
            resolve(val);
          },
          reject: (err) => {
            if (abortSignal) abortSignal.removeEventListener('abort', onAbort);
            reject(err);
          }
        });

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
    if (this.initTimeoutTimer !== null) {
      clearTimeout(this.initTimeoutTimer);
      this.initTimeoutTimer = null;
    }
    for (const [, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('Web Worker был принудительно остановлен'));
    }
    this.pendingRequests.clear();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.readyPromise = null;
      this.readyResolve = null;
      this.readyReject = null;
    }
  }
}
