// 1. Polyfill Headers in Electron Web Worker if absent
if (typeof (globalThis as any).Headers === 'undefined') {
  (globalThis as any).Headers = class Headers {
    private map = new Map<string, string>();
    constructor(init?: any) {
      if (init) {
        if (init instanceof Headers || init?.map) {
          for (const [k, v] of (init.map || init).entries()) this.set(k, v);
        } else if (Array.isArray(init)) {
          for (const [k, v] of init) this.set(k, v);
        } else if (typeof init === 'object') {
          for (const k of Object.keys(init)) this.set(k, init[k]);
        }
      }
    }
    append(name: string, value: string) { this.map.set(name.toLowerCase(), value); }
    delete(name: string) { this.map.delete(name.toLowerCase()); }
    get(name: string) { return this.map.get(name.toLowerCase()) ?? null; }
    has(name: string) { return this.map.has(name.toLowerCase()); }
    set(name: string, value: string) { this.map.set(name.toLowerCase(), value); }
    forEach(callback: any) { this.map.forEach(callback); }
    entries() { return this.map.entries(); }
    keys() { return this.map.keys(); }
    values() { return this.map.values(); }
    [Symbol.iterator]() { return this.map.entries(); }
  };
}

// 2. Global worker error traps
self.onerror = (e: any) => {
  const errMsg = typeof e === 'string' ? e : (e?.message ? `${e.message} at ${e.filename || 'worker'}:${e.lineno || '?'}:${e.colno || '?'}` : 'Worker runtime error');
  self.postMessage({ type: 'ERROR', error: errMsg });
};
self.onunhandledrejection = (e: any) => {
  const reason = e?.reason;
  const errMsg = reason?.stack || reason?.message || String(reason || 'Unhandled rejection in worker');
  self.postMessage({ type: 'ERROR', error: errMsg });
};

import { pipeline, env } from '@xenova/transformers';
import { WorkerInMessage, WorkerOutMessage } from '../../types';

// Configure transformers.js for browser / worker environment
env.allowLocalModels = false;
env.useBrowserCache = true;
env.useFS = false;
env.useFSCache = false;

// Point WASM to verified jsdelivr CDN and force single-threading (avoids SharedArrayBuffer requirement in Electron)
if (env?.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';
  env.backends.onnx.wasm.numThreads = 1;
}

const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

let extractor: any = null;
let isInitializing = false;
let initError: string | null = null;

async function getExtractor() {
  if (extractor) return extractor;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (extractor) return extractor;
    if (initError) throw new Error(initError);
  }

  isInitializing = true;
  initError = null;

  const maxRetries = 3;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Load feature-extraction pipeline with ONNX quantized model for fast in-browser inference
      extractor = await pipeline('feature-extraction', MODEL_NAME, {
        quantized: true,
        progress_callback: (data: any) => {
          if (data?.status === 'progress') {
            const progressMsg: WorkerOutMessage = {
              type: 'MODEL_DOWNLOAD_PROGRESS',
              file: data.file || 'model',
              progress: Math.round(data.progress || 0)
            };
            self.postMessage(progressMsg);
          } else if (data?.status === 'done' || data?.status === 'ready') {
            const progressMsg: WorkerOutMessage = {
              type: 'MODEL_DOWNLOAD_PROGRESS',
              file: data.file || 'model',
              progress: 100
            };
            self.postMessage(progressMsg);
          }
        }
      });
      break;
    } catch (err: any) {
      lastErr = err;
      if (attempt < maxRetries) {
        self.postMessage({
          type: 'MODEL_DOWNLOAD_PROGRESS',
          file: `Сетевой сбой при загрузке модели, повтор ${attempt + 1}/${maxRetries}...`,
          progress: 0
        });
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }

  isInitializing = false;

  if (!extractor) {
    initError = lastErr?.message || 'Failed to initialize @xenova/transformers pipeline';
    throw new Error(initError);
  }

  self.postMessage({
    type: 'MODEL_DOWNLOAD_PROGRESS',
    file: 'ONNX WebAssembly скомпилирован',
    progress: 100
  });
  return extractor;
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === 'INIT') {
    initError = null;
    try {
      await getExtractor();
      const readyMsg: WorkerOutMessage = { type: 'READY' };
      self.postMessage(readyMsg);
    } catch (err: any) {
      const errMsg: WorkerOutMessage = {
        type: 'ERROR',
        error: `[Embedding Worker Init Error] ${err?.stack || err?.message || String(err)}`
      };
      self.postMessage(errMsg);
    }
    return;
  }

  if (msg.type === 'EMBED_BATCH') {
    try {
      const pipe = await getExtractor();
      const results: Array<{ id: string; embedding: Float32Array }> = [];

      for (const item of msg.items) {
        const output = await pipe(item.text, {
          pooling: 'mean',
          normalize: true
        });

        // output.data is already Float32Array from ONNX WebAssembly
        const embeddingData = output.data instanceof Float32Array
          ? output.data
          : new Float32Array(output.data);

        results.push({
          id: item.id,
          embedding: embeddingData
        });
      }

      const transferBuffers = results.map(r => r.embedding.buffer);
      const response: WorkerOutMessage = {
        type: 'EMBED_COMPLETE',
        id: msg.id,
        results
      };

      // Use zero-copy Transferable ArrayBuffers
      self.postMessage(response, transferBuffers as any);
    } catch (err: any) {
      const errorResponse: WorkerOutMessage = {
        type: 'ERROR',
        id: msg.id,
        error: err?.message || 'Batch embedding generation failed'
      };
      self.postMessage(errorResponse);
    }
  }
};
