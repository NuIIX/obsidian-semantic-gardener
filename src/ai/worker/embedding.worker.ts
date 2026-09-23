import { pipeline, env } from '@xenova/transformers';
import { WorkerInMessage, WorkerOutMessage } from '../../types';

// Configure transformers.js for browser / worker environment
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

let extractor: any = null;
let isInitializing = false;
let initError: string | null = null;

async function getExtractor() {
  if (extractor) return extractor;
  if (initError) throw new Error(initError);
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (extractor) return extractor;
    if (initError) throw new Error(initError);
  }

  isInitializing = true;
  try {
    // Load feature-extraction pipeline with ONNX quantized model for fast in-browser inference
    extractor = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true
    });
    isInitializing = false;
    return extractor;
  } catch (err: any) {
    isInitializing = false;
    initError = err?.message || 'Failed to initialize @xenova/transformers pipeline';
    throw new Error(initError);
  }
}

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  if (msg.type === 'INIT') {
    try {
      await getExtractor();
      const readyMsg: WorkerOutMessage = { type: 'READY' };
      self.postMessage(readyMsg);
    } catch (err: any) {
      const errMsg: WorkerOutMessage = { type: 'ERROR', error: err.message };
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
