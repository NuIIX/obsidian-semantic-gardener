import test from 'node:test';
import assert from 'node:assert';
import { TransactionManager } from '../src/storage/transaction-manager.ts';
import { TFile } from 'obsidian';

// Mock Obsidian App and Vault
function createMockApp() {
  const files = new Map();
  const trashed = [];

  const mockApp = {
    vault: {
      adapter: {
        exists: async (path) => files.has(path),
        read: async (path) => files.get(path) ?? '',
        write: async (path, content) => { files.set(path, content); },
        mkdir: async () => {}
      },
      read: async (file) => files.get(file.path) ?? '',
      modify: async (file, content) => {
        files.set(file.path, content);
      },
      create: async (path, content) => {
        if (files.has(path)) {
          throw new Error('File already exists');
        }
        files.set(path, content);
        return new TFile(path);
      },
      process: async (file, fn) => {
        const current = files.get(file.path) ?? '';
        const updated = fn(current);
        files.set(file.path, updated);
      },
      trash: async (file) => {
        trashed.push(file.path);
        files.delete(file.path);
      },
      getAbstractFileByPath: (path) => {
        if (files.has(path)) {
          return new TFile(path);
        }
        return null;
      },
      createFolder: async () => {}
    }
  };

  return { mockApp, files, trashed };
}

test('TransactionManager: pre-validates and rejects when original span is modified externally', async () => {
  const { mockApp, files } = createMockApp();
  const txManager = new TransactionManager(mockApp, 'test-plugin', 10);

  const fileA = { path: 'Notes/Book.md', basename: 'Book' };
  files.set(fileA.path, 'Some modified text that does not match original span.');

  const result = await txManager.applyRefactor(
    'Little Law',
    'Concepts/Little Law.md',
    '# Little Law\n\nCanonical definition.',
    [
      {
        file: fileA,
        originalSpan: 'Expected original span',
        newSpan: '[[Little Law]]',
        mode: 'inline'
      }
    ]
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('изменен'));
  assert.strictEqual(files.has('Concepts/Little Law.md'), false);
});

test('TransactionManager: applies refactor atomically and undoes in 1 click', async () => {
  const { mockApp, files, trashed } = createMockApp();
  const txManager = new TransactionManager(mockApp, 'test-plugin', 10);

  const fileA = { path: 'Notes/Chapter1.md', basename: 'Chapter1' };
  const originalText = 'According to the principle of Little Law, cycle time depends on WIP.';
  files.set(fileA.path, originalText);

  // Apply refactor
  const applyResult = await txManager.applyRefactor(
    'Little Law',
    'Concepts/Little Law.md',
    '# Little Law\n\nL = lambda * W.',
    [
      {
        file: fileA,
        originalSpan: 'the principle of Little Law',
        newSpan: '[[Little Law]]',
        mode: 'inline'
      }
    ]
  );

  assert.strictEqual(applyResult.success, true);
  assert.strictEqual(files.has('Concepts/Little Law.md'), true);
  assert.strictEqual(files.get('Concepts/Little Law.md'), '# Little Law\n\nL = lambda * W.');
  assert.strictEqual(files.get(fileA.path), 'According to [[Little Law]], cycle time depends on WIP.');

  // Undo refactor
  const undoResult = await txManager.undoLast();
  assert.strictEqual(undoResult, true);

  // File A must be restored to exact original content
  assert.strictEqual(files.get(fileA.path), originalText);

  // Created concept note must be trashed
  assert.strictEqual(files.has('Concepts/Little Law.md'), false);
  assert.ok(trashed.includes('Concepts/Little Law.md'));
});
