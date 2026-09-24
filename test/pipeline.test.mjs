import test from 'node:test';
import assert from 'node:assert';
import { parseMarkdown } from '../src/core/parser.ts';
import { chunkMarkdown } from '../src/core/chunker.ts';
import { sha256 } from '../src/core/hasher.ts';
import { 
  cosineSimilarity, 
  findCandidateClusters, 
  normalizeVector, 
  dotProduct, 
  FlatVectorMatrix, 
  getDomainFromPath, 
  findClustersForNote 
} from '../src/ai/vector-search.ts';
import { diffWordsUnicode } from '../src/utils/diff-helper.ts';
import { refactorEngineSchema } from '../src/types/llm-schema.ts';

test('hasher: generates deterministic SHA-256 string', async () => {
  const hash1 = await sha256('Hello World');
  const hash2 = await sha256('Hello World');
  const hash3 = await sha256('Different string');

  assert.strictEqual(typeof hash1, 'string');
  assert.strictEqual(hash1.length, 64);
  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hash3);
});

test('parser: filters YAML frontmatter and code blocks correctly', () => {
  const md = `---
title: Sample Note
tags: [test, ai]
---

# Main Heading

Here is a normal paragraph defining a concept.

\`\`\`typescript
const codeShouldBeIgnored = true;
function ignoreMe() { return null; }
\`\`\`

## Subheading

Another paragraph under subheading with detailed information.
`;

  const parsed = parseMarkdown('Notes/Test.md', md);
  assert.strictEqual(parsed.filePath, 'Notes/Test.md');

  // Should have 2 headings and 2 paragraphs, no code block or frontmatter nodes
  const headingNodes = parsed.nodes.filter(n => n.type === 'heading');
  const paragraphNodes = parsed.nodes.filter(n => n.type === 'paragraph');

  assert.strictEqual(headingNodes.length, 2);
  assert.strictEqual(headingNodes[0].text, 'Main Heading');
  assert.strictEqual(headingNodes[0].level, 1);
  assert.strictEqual(headingNodes[1].text, 'Subheading');
  assert.strictEqual(headingNodes[1].level, 2);

  assert.strictEqual(paragraphNodes.length, 2);
  assert.ok(paragraphNodes[0].text.includes('defining a concept'));
  assert.ok(paragraphNodes[1].text.includes('detailed information'));

  // Ensure no code block text leaked in
  const anyCodeLeaked = parsed.nodes.some(n => n.text.includes('codeShouldBeIgnored'));
  assert.strictEqual(anyCodeLeaked, false);
});

test('chunker: creates Context Breadcrumbs [Path > H1 > H2]', async () => {
  const md = `# Computer Architecture

## Memory Hierarchy

A bottleneck occurs when the CPU is starved of data due to high memory access latency.

### Cache Latency

Another paragraph explaining cache levels and memory speeds.
`;

  const chunks = await chunkMarkdown('Hardware/Processors.md', md, { minChunkLength: 30 });
  assert.strictEqual(chunks.length, 2);

  assert.strictEqual(
    chunks[0].breadcrumbs,
    '[Hardware/Processors.md > Computer Architecture > Memory Hierarchy]'
  );
  assert.ok(chunks[0].fullContext.startsWith('[Hardware/Processors.md > Computer Architecture > Memory Hierarchy]'));
  assert.ok(chunks[0].fullContext.includes('bottleneck occurs'));

  assert.strictEqual(
    chunks[1].breadcrumbs,
    '[Hardware/Processors.md > Computer Architecture > Memory Hierarchy > Cache Latency]'
  );
});

test('vector-search: computes accurate cosine similarity', () => {
  const vecA = new Float32Array([1, 0, 0]);
  const vecB = new Float32Array([1, 0, 0]);
  const vecC = new Float32Array([0, 1, 0]);
  const vecD = new Float32Array([0.7071, 0.7071, 0]);

  const simIdentical = cosineSimilarity(vecA, vecB);
  assert.ok(Math.abs(simIdentical - 1.0) < 0.001);

  const simOrthogonal = cosineSimilarity(vecA, vecC);
  assert.ok(Math.abs(simOrthogonal - 0.0) < 0.001);

  const simAngle45 = cosineSimilarity(vecA, vecD);
  assert.ok(Math.abs(simAngle45 - 0.7071) < 0.01);
});

test('vector-search: clusters duplicate candidates across distinct files only', () => {
  const chunkFile1 = {
    id: 'chunk-1',
    filePath: 'Book A.md',
    text: 'Little Law is L = lambda * W in queueing theory.',
    breadcrumbs: '[Book A.md > Queueing]',
    fullContext: '[Book A.md > Queueing]\nLittle Law is L = lambda * W in queueing theory.',
    startLine: 5,
    endLine: 6,
    embedding: new Float32Array([0.9, 0.1, 0.0])
  };

  const chunkFile2 = {
    id: 'chunk-2',
    filePath: 'Book B.md',
    text: "Little's formula states that the average number of items equals arrival rate times wait time.",
    breadcrumbs: '[Book B.md > Metrics]',
    fullContext: "[Book B.md > Metrics]\nLittle's formula states that the average number of items equals arrival rate times wait time.",
    startLine: 12,
    endLine: 13,
    embedding: new Float32Array([0.89, 0.11, 0.0])
  };

  const chunkSameFile = {
    id: 'chunk-3',
    filePath: 'Book A.md',
    text: 'Another section in Book A repeating queueing metrics.',
    breadcrumbs: '[Book A.md > Summary]',
    fullContext: '[Book A.md > Summary]\nAnother section in Book A repeating queueing metrics.',
    startLine: 40,
    endLine: 41,
    embedding: new Float32Array([0.9, 0.1, 0.0])
  };

  const chunkUnrelated = {
    id: 'chunk-4',
    filePath: 'Cooking/Recipe.md',
    text: 'Bake the dough at 200 degrees Celsius for 25 minutes.',
    breadcrumbs: '[Cooking/Recipe.md > Bread]',
    fullContext: '[Cooking/Recipe.md > Bread]\nBake the dough at 200 degrees Celsius for 25 minutes.',
    startLine: 1,
    endLine: 2,
    embedding: new Float32Array([0.0, 0.0, 1.0])
  };

  const clusters = findCandidateClusters([chunkFile1, chunkFile2, chunkSameFile, chunkUnrelated], 0.82);

  // Should have 1 candidate cluster pairing Book A and Book B
  assert.strictEqual(clusters.length, 1);
  const cluster = clusters[0];
  assert.ok(cluster.similarity >= 0.82);
  assert.strictEqual(cluster.domain, '(Root)');

  const filePaths = cluster.chunks.map(c => c.filePath);
  assert.ok(filePaths.includes('Book A.md'));
  assert.ok(filePaths.includes('Book B.md'));
  assert.ok(!filePaths.includes('Cooking/Recipe.md'));
});

test('vector-search: FlatVectorMatrix and dotProduct match cosine similarity', () => {
  const vec1 = new Float32Array([3, 4, 0]);
  const norm1 = normalizeVector(vec1);
  assert.ok(Math.abs(norm1[0] - 0.6) < 0.001);
  assert.ok(Math.abs(norm1[1] - 0.8) < 0.001);

  const vec2 = new Float32Array([1, 0, 0]);
  const norm2 = normalizeVector(vec2);
  const dot = dotProduct(norm1, norm2);
  const cos = cosineSimilarity(vec1, vec2);
  assert.ok(Math.abs(dot - cos) < 0.001);
  assert.ok(Math.abs(dot - 0.6) < 0.001);

  assert.strictEqual(getDomainFromPath('Work/Projects/Task.md'), 'Work');
  assert.strictEqual(getDomainFromPath('Notes.md'), '(Root)');
});

test('vector-search: findClustersForNote performs targeted single-note clustering', () => {
  const chunkNoteA = {
    id: 'chunk-a',
    filePath: 'Work/NoteA.md',
    text: 'Architecture of distributed systems.',
    breadcrumbs: '[Work/NoteA.md > Arch]',
    fullContext: '[Work/NoteA.md > Arch]\nArchitecture of distributed systems.',
    startLine: 1,
    endLine: 2,
    embedding: new Float32Array([1.0, 0.0, 0.0])
  };

  const chunkNoteB = {
    id: 'chunk-b',
    filePath: 'Personal/NoteB.md',
    text: 'Distributed system concepts and architecture.',
    breadcrumbs: '[Personal/NoteB.md > Concepts]',
    fullContext: '[Personal/NoteB.md > Concepts]\nDistributed system concepts and architecture.',
    startLine: 5,
    endLine: 6,
    embedding: new Float32Array([0.98, 0.02, 0.0])
  };

  const chunkOther = {
    id: 'chunk-c',
    filePath: 'Archive/Other.md',
    text: 'Completely different topic.',
    breadcrumbs: '[Archive/Other.md]',
    fullContext: '[Archive/Other.md]\nCompletely different topic.',
    startLine: 1,
    endLine: 2,
    embedding: new Float32Array([0.0, 1.0, 0.0])
  };

  const results = findClustersForNote('Work/NoteA.md', [chunkNoteA, chunkNoteB, chunkOther], 0.85);
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].domain, 'Cross-folder');
  assert.ok(results[0].chunks.some(c => c.filePath === 'Work/NoteA.md'));
  assert.ok(results[0].chunks.some(c => c.filePath === 'Personal/NoteB.md'));
});

test('diff: calculates word-level changes accurately', () => {
  const original = 'Закон Литтла утверждает, что среднее число заявок равно пропускной способности.';
  const replacement = 'Согласно [[Закон Литтла]], время цикла зависит от пропускной способности.';

  const changes = diffWordsUnicode(original, replacement);
  assert.ok(changes.length > 1);

  const hasAdded = changes.some(c => c.added && c.value.includes('[['));
  const hasRemoved = changes.some(c => c.removed && c.value.includes('утверждает'));

  assert.strictEqual(hasAdded, true);
  assert.strictEqual(hasRemoved, true);
});

test('llm-schema: satisfies required Gemini Structured Output contract', () => {
  assert.strictEqual(refactorEngineSchema.type, 'OBJECT');
  assert.ok(refactorEngineSchema.properties.isDuplicate);
  assert.ok(refactorEngineSchema.properties.conceptTitle);
  assert.ok(refactorEngineSchema.properties.canonicalNoteMarkdown);
  assert.ok(refactorEngineSchema.properties.modifications);
  assert.ok(refactorEngineSchema.required.includes('isDuplicate'));
});

test('LoggerService: records progress and writes formatted logs with stack traces to adapter', async () => {
  const written = [];
  const mockAdapter = {
    exists: async () => true,
    write: async (path, data) => { written.push({ op: 'write', path, data }); },
    append: async (path, data) => { written.push({ op: 'append', path, data }); },
    stat: async () => ({ size: 100 })
  };
  const mockApp = {
    vault: {
      adapter: mockAdapter,
      configDir: '.obsidian'
    }
  };

  const { LoggerService } = await import('../src/core/logger.ts');
  const logger = new LoggerService();
  await logger.initFileLogger(mockApp, 'obsidian-semantic-gardener');

  logger.startSession('Анализ заметки');
  logger.updateProgress('Векторизация', 30, 'Векторизация 1 фрагментов');
  logger.error('Сбой операции', 'Error: Stack trace at line 42\n    at func()');

  // Allow queue flush
  await new Promise(r => setTimeout(r, 100));

  const allWritten = written.map(w => w.data).join('\n');
  assert.ok(allWritten.includes('Semantic Gardener Session Initialized'));
  assert.ok(allWritten.includes('[ERROR] [Векторизация 30%] Сбой операции'));
  assert.ok(allWritten.includes('Stack / Details: Error: Stack trace at line 42'));
});

test('pathShim: correctly emulates POSIX dirname, basename, join and normalize', async () => {
  const pathShim = (await import('../src/utils/path-shim.ts')).default;

  assert.strictEqual(pathShim.dirname('/a/b/c.wasm'), '/a/b');
  assert.strictEqual(pathShim.dirname('c.wasm'), '.');
  assert.strictEqual(pathShim.dirname('/c.wasm'), '/');
  assert.strictEqual(pathShim.basename('/a/b/c.wasm'), 'c.wasm');
  assert.strictEqual(pathShim.basename('/a/b/c.wasm', '.wasm'), 'c');
  assert.strictEqual(pathShim.extname('/a/b/c.wasm'), '.wasm');
  assert.strictEqual(pathShim.join('/a', 'b', 'c.wasm'), '/a/b/c.wasm');
  assert.strictEqual(pathShim.normalize('/a/b/../c/./d.wasm'), '/a/c/d.wasm');
});

test('note-comparer: accurately detects exact duplicate and partial diff', async () => {
  const { compareNotes } = await import('../src/core/note-comparer.ts');

  const contentA = `# SQL Indexing\nIndexes speed up reading data.\nHowever, too many indexes slow down writes.\n`;
  const contentIdentical = `# SQL Indexing\nIndexes speed up reading data.\nHowever, too many indexes slow down writes.\n`;
  const contentB = `# SQL Indexing\nIndexes significantly speed up reading data.\nHowever, excessive indexes degrade write performance.\n`;

  const exactResult = compareNotes(contentA, contentIdentical);
  assert.strictEqual(exactResult.isExactDuplicate, true);
  assert.strictEqual(exactResult.similarityPercent, 100);
  assert.strictEqual(exactResult.totalLinesA, 3);
  assert.strictEqual(exactResult.totalLinesB, 3);
  assert.strictEqual(exactResult.matchingLines, 3);

  const partialResult = compareNotes(contentA, contentB);
  assert.strictEqual(partialResult.isExactDuplicate, false);
  assert.ok(partialResult.similarityPercent > 0 && partialResult.similarityPercent < 100);
  assert.ok(partialResult.changes.some(c => c.added || c.removed));
});

test('GeminiClient: multi-key pool rotates to next key on rotation and wraps around', async () => {
  const { GeminiClient } = await import('../src/ai/gemini-client.ts');
  const rotatedEvents = [];
  const client = new GeminiClient(
    ['key-1-alpha', 'key-2-beta', 'key-3-gamma'],
    'gemini-3.5-flash',
    (info) => rotatedEvents.push(info)
  );

  assert.strictEqual(client.getActiveApiKey(), 'key-1-alpha');
  assert.strictEqual(client.getApiKeysCount(), 3);
  assert.strictEqual(client.getCurrentKeyIndex(), 0);

  // Rotate key
  const rotated = client.rotateToNextKey('Тест ротации');
  assert.strictEqual(rotated, true);
  assert.strictEqual(client.getActiveApiKey(), 'key-2-beta');
  assert.strictEqual(client.getCurrentKeyIndex(), 1);
  assert.strictEqual(rotatedEvents.length, 1);
  assert.strictEqual(rotatedEvents[0].prevIndex, 0);
  assert.strictEqual(rotatedEvents[0].index, 1);

  // Rotate again
  client.rotateToNextKey('Тест ротации 2');
  assert.strictEqual(client.getActiveApiKey(), 'key-3-gamma');
  assert.strictEqual(client.getCurrentKeyIndex(), 2);

  // Wrap around to 0
  client.rotateToNextKey('Тест ротации 3');
  assert.strictEqual(client.getActiveApiKey(), 'key-1-alpha');
  assert.strictEqual(client.getCurrentKeyIndex(), 0);
});

test('aliases: ensureFrontmatterAliases formats and injects YAML frontmatter correctly', async () => {
  const { ensureFrontmatterAliases } = await import('../src/utils/vault-mutator.ts');

  // Case 1: No existing frontmatter
  const plainText = `# Distributed Caching\nCaching reduces database load.`;
  const result1 = ensureFrontmatterAliases(plainText, ['Кэширование', 'Distributed Cache']);
  assert.ok(result1.startsWith('---\naliases:\n  - "Кэширование"\n  - "Distributed Cache"\n---'));
  assert.ok(result1.includes('# Distributed Caching'));

  // Case 2: Existing frontmatter without aliases
  const withFrontmatter = `---\ntags: [arch, perf]\n---\n# Distributed Caching`;
  const result2 = ensureFrontmatterAliases(withFrontmatter, ['Кэширование']);
  assert.ok(result2.includes('tags: [arch, perf]'));
  assert.ok(result2.includes('aliases:\n  - "Кэширование"'));

  // Case 3: Empty aliases leaves content untouched
  const untouched = ensureFrontmatterAliases(plainText, []);
  assert.strictEqual(untouched, plainText);
});

test('LocalLlmClient: instantiates and updates OpenAI-compatible configuration', async () => {
  const { LocalLlmClient } = await import('../src/ai/local-llm-client.ts');
  const client = new LocalLlmClient('http://localhost:11434/v1', 'llama3.2', 'secret-token');
  assert.ok(client);

  client.updateConfig('http://localhost:1234/v1', 'qwen2.5', '');
  assert.ok(client);
});


