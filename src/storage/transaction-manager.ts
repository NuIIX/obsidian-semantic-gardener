import type { App, TFile } from 'obsidian';
import type { Transaction, FileBackup, ModificationMode } from '../types/index.ts';

function normalizePath(path: string): string {
  return path ? path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '') : '';
}

function showNotice(msg: string): void {
  try {
    if (typeof (globalThis as any).Notice === 'function') {
      new (globalThis as any).Notice(msg);
    } else {
      const obs = (globalThis as any)?.require?.('obsidian');
      if (obs?.Notice) {
        new obs.Notice(msg);
      }
    }
  } catch {
    // Silent in testing environment
  }
}

function isTFile(file: any): boolean {
  if (!file) return false;
  if (typeof (globalThis as any).TFile === 'function') {
    return file instanceof (globalThis as any).TFile;
  }
  return typeof file.path === 'string';
}

export interface MutationRequest {
  file: TFile;
  originalSpan: string;
  newSpan: string;
  mode: ModificationMode;
}

export interface RefactorApplyResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export class TransactionManager {
  private history: Transaction[] = [];
  private historyFilePath: string;
  private app: App;
  private pluginId: string;
  private maxHistoryLength: number;

  constructor(
    app: App,
    pluginId: string = 'obsidian-semantic-gardener',
    maxHistoryLength: number = 20
  ) {
    this.app = app;
    this.pluginId = pluginId;
    this.maxHistoryLength = maxHistoryLength;
    this.historyFilePath = normalizePath(`.obsidian/plugins/${this.pluginId}/history.json`);
  }

  setMaxHistoryLength(max: number) {
    this.maxHistoryLength = max;
    this.trimHistory();
  }

  getHistory(): Transaction[] {
    return [...this.history];
  }

  async init(): Promise<void> {
    await this.loadHistory();
  }

  private trimHistory() {
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(this.history.length - this.maxHistoryLength);
    }
  }

  async loadHistory(): Promise<void> {
    try {
      const exists = await this.app.vault.adapter.exists(this.historyFilePath);
      if (exists) {
        const raw = await this.app.vault.adapter.read(this.historyFilePath);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.history = parsed;
          this.trimHistory();
        }
      }
    } catch (e) {
      console.warn('Semantic Gardener: Failed to load history.json', e);
      this.history = [];
    }
  }

  async saveHistory(): Promise<void> {
    try {
      const dir = normalizePath(`.obsidian/plugins/${this.pluginId}`);
      const dirExists = await this.app.vault.adapter.exists(dir);
      if (!dirExists) {
        await this.app.vault.adapter.mkdir(dir);
      }
      await this.app.vault.adapter.write(this.historyFilePath, JSON.stringify(this.history, null, 2));
    } catch (e) {
      console.error('Semantic Gardener: Failed to save history.json', e);
    }
  }

  async applyRefactor(
    conceptTitle: string,
    newNotePath: string,
    newNoteContent: string,
    mutations: MutationRequest[]
  ): Promise<RefactorApplyResult> {
    const activeMutations = mutations.filter(m => m.mode !== 'skip');
    const backups: FileBackup[] = [];

    // 1. Pre-validation: Verify all original spans still match target files exactly
    for (const m of activeMutations) {
      if (!m.file) {
        const msg = `File not found for mutation in ${conceptTitle}`;
        showNotice(msg);
        return { success: false, error: msg };
      }

      const currentContent = await this.app.vault.read(m.file);
      if (!currentContent.includes(m.originalSpan)) {
        const msg = `Ошибка валидации: Текст в файле "${m.file.basename}" был изменен. Операция отменена.`;
        showNotice(msg);
        return { success: false, error: msg };
      }

      backups.push({
        path: m.file.path,
        content: currentContent
      });
    }

    // 2. Ensure target folder exists
    const normalizedPath = normalizePath(newNotePath);
    const lastSlash = normalizedPath.lastIndexOf('/');
    if (lastSlash !== -1) {
      const parentFolder = normalizedPath.substring(0, lastSlash);
      const folderExists = await this.app.vault.adapter.exists(parentFolder);
      if (!folderExists) {
        await this.app.vault.createFolder(parentFolder);
      }
    }

    // 3. Create the canonical atomic note
    const existingFile = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (existingFile) {
      const msg = `Ошибка: Заметка "${normalizedPath}" уже существует. Выберите другое название.`;
      showNotice(msg);
      return { success: false, error: msg };
    }

    try {
      await this.app.vault.create(normalizedPath, newNoteContent);
    } catch (err: any) {
      const msg = `Не удалось создать заметку "${normalizedPath}": ${err.message}`;
      showNotice(msg);
      return { success: false, error: msg };
    }

    // 4. Atomically mutate existing files via vault.process()
    for (const m of activeMutations) {
      try {
        await this.app.vault.process(m.file, (data) => {
          return data.replace(m.originalSpan, m.newSpan);
        });
      } catch (err: any) {
        const msg = `Ошибка при изменении файла "${m.file.path}": ${err.message}`;
        showNotice(msg);
        // Note: in a catastrophic mid-way error, user can still run Undo
      }
    }

    // 5. Append transaction to snapshot journal
    const transaction: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      timestamp: Date.now(),
      conceptTitle,
      createdPath: normalizedPath,
      createdContent: newNoteContent,
      backups
    };

    this.history.push(transaction);
    this.trimHistory();
    await this.saveHistory();

    showNotice(`Рефакторинг "${conceptTitle}" успешно применен!`);
    return { success: true, transaction };
  }

  async undoLast(): Promise<boolean> {
    const lastTx = this.history.pop();
    if (!lastTx) {
      showNotice('Нет доступных действий для отката.');
      return false;
    }

    let restoredCount = 0;

    // 1. Restore modified files from snapshot
    for (const backup of lastTx.backups) {
      const file = this.app.vault.getAbstractFileByPath(backup.path);
      if (isTFile(file)) {
        try {
          await this.app.vault.modify(file, backup.content);
          restoredCount++;
        } catch (e) {
          console.error(`Failed to restore file ${backup.path}`, e);
        }
      }
    }

    // 2. Trash the created atomic note
    const createdFile = this.app.vault.getAbstractFileByPath(lastTx.createdPath);
    if (isTFile(createdFile)) {
      try {
        await this.app.vault.trash(createdFile, false);
      } catch (e) {
        console.error(`Failed to trash file ${lastTx.createdPath}`, e);
      }
    }

    await this.saveHistory();
    showNotice(`Откат выполнен: восстановлено ${restoredCount} файлов, заметка "${lastTx.conceptTitle}" отправлена в корзину.`);
    return true;
  }
}
