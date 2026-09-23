import test from 'node:test';
import assert from 'node:assert';
import { parseMarkdown } from '../src/core/parser.ts';
import { chunkMarkdown } from '../src/core/chunker.ts';
import { sha256 } from '../src/core/hasher.ts';
import { cosineSimilarity, findCandidateClusters } from '../src/ai/vector-search.ts';
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

  const filePaths = cluster.chunks.map(c => c.filePath);
  assert.ok(filePaths.includes('Book A.md'));
  assert.ok(filePaths.includes('Book B.md'));
  assert.ok(!filePaths.includes('Cooking/Recipe.md'));
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
