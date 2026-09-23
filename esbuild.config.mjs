import esbuild from 'esbuild';
import process from 'process';
import esbuildSvelte from 'esbuild-svelte';
import { sveltePreprocess } from 'svelte-preprocess';

const isProd = process.argv[2] === 'production';

// External modules provided by the Obsidian runtime environment
const obsidianExternals = [
  'obsidian',
  'electron',
  '@codemirror/autocomplete',
  '@codemirror/collab',
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/search',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr'
];

async function build() {
  console.log(`Building Semantic Gardener (${isProd ? 'production' : 'development'})...`);

  // 1. Build Main Plugin Bundle
  const mainContext = await esbuild.context({
    banner: {
      js: '/* Semantic Gardener Plugin - (c) 2026 NuIIX - MIT License */'
    },
    entryPoints: ['src/main.ts'],
    bundle: true,
    external: obsidianExternals,
    format: 'cjs',
    target: 'es2022',
    logLevel: 'info',
    sourcemap: !isProd ? 'inline' : false,
    treeShaking: true,
    outfile: 'main.js',
    plugins: [
      esbuildSvelte({
        compilerOptions: {
          css: 'injected'
        },
        preprocess: sveltePreprocess()
      })
    ]
  });

    // 2. Build Web Worker Bundle
    const workerHeadersPolyfill = `
/* Headers polyfill for Electron Web Worker */
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init) {
      this._map = new Map();
      if (init) {
        if (init instanceof Headers || init?._map) {
          const entries = (init._map || init).entries();
          for (const [k, v] of entries) this.set(k, v);
        } else if (Array.isArray(init)) {
          for (const [k, v] of init) this.set(k, v);
        } else if (typeof init === 'object') {
          for (const k of Object.keys(init)) this.set(k, init[k]);
        }
      }
    }
    append(k, v) { this.set(k, (this.get(k) ? this.get(k) + ', ' : '') + v); }
    delete(k) { this._map.delete(k.toLowerCase()); }
    get(k) { return this._map.get(k.toLowerCase()) ?? null; }
    has(k) { return this._map.has(k.toLowerCase()); }
    set(k, v) { this._map.set(k.toLowerCase(), String(v)); }
    forEach(cb) { this._map.forEach(cb); }
    entries() { return this._map.entries(); }
    keys() { return this._map.keys(); }
    values() { return this._map.values(); }
    [Symbol.iterator]() { return this._map.entries(); }
  };
}
if (typeof self !== 'undefined' && typeof self.Headers === 'undefined') {
  self.Headers = globalThis.Headers;
}
if (typeof process !== 'undefined') {
  try {
    if (process.versions) {
      delete process.versions.node;
    }
  } catch (e) {}
}
`;

  const workerContext = await esbuild.context({
    banner: {
      js: workerHeadersPolyfill
    },
    entryPoints: ['src/ai/worker/embedding.worker.ts'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    logLevel: 'info',
    sourcemap: !isProd ? 'inline' : false,
    treeShaking: true,
    outfile: 'worker.js',
    define: {
      'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
      'process.release.name': '"browser"',
      'process.versions.node': 'undefined',
      'process.version': '""'
    },
    alias: {
      'fs': './src/utils/empty-shim.ts',
      'path': './src/utils/path-shim.ts',
      'url': './src/utils/empty-shim.ts',
      'sharp': './src/utils/empty-shim.ts',
      'onnxruntime-node': './src/utils/empty-shim.ts'
    }
  });

  if (isProd) {
    await mainContext.rebuild();
    await workerContext.rebuild();
    await mainContext.dispose();
    await workerContext.dispose();
    console.log('Build completed successfully.');
  } else {
    await mainContext.watch();
    await workerContext.watch();
    console.log('Watching for changes...');
  }
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
