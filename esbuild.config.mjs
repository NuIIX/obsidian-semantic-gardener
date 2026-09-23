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
  const workerContext = await esbuild.context({
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
      'process.env.NODE_ENV': isProd ? '"production"' : '"development"'
    },
    alias: {
      'fs': './src/utils/empty-shim.ts',
      'path': './src/utils/empty-shim.ts',
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
