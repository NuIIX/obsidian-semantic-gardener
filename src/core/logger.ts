import type { App } from 'obsidian';
import type { LogEntry, LogLevel, ProgressState } from '../types/index.ts';

export type LogListener = (state: { logs: LogEntry[]; progress: ProgressState }) => void;

export class LoggerService {
  private static MAX_LOGS = 200;
  private static MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB rotation cap
  private logs: LogEntry[] = [];
  private progressState: ProgressState = {
    phase: 'Ожидание',
    percentage: 0,
    message: 'Готов к работе',
    isScanning: false,
    canCancel: false
  };

  private listeners = new Set<LogListener>();
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  private hasPendingNotification = false;
  private abortController: AbortController | null = null;

  // File Logger integration
  private app: App | null = null;
  private pluginId: string = 'obsidian-semantic-gardener';
  private logFilePath: string = '.obsidian/plugins/obsidian-semantic-gardener/debug.log';
  private writeQueue: string[] = [];
  private isWritingToFile = false;
  private fileLoggerInitialized = false;

  constructor() {
    this.addLog('info', 'Semantic Gardener инициализирован.');
  }

  get abortSignal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }

  get isCancelled(): boolean {
    return this.abortController?.signal.aborted ?? false;
  }

  /**
   * Start a new cancellable task session
   */
  startSession(initialMessage: string = 'Запуск процесса...'): AbortSignal {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    this.progressState = {
      phase: 'Инициализация',
      percentage: 0,
      message: initialMessage,
      isScanning: true,
      canCancel: true,
      startTime: Date.now()
    };

    this.addLog('info', initialMessage);
    this.flushImmediately();
    return this.abortController.signal;
  }

  /**
   * Cancel currently running task
   */
  cancelSession(): void {
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
      this.addLog('warn', 'Операция прервана пользователем.');
    }

    this.progressState = {
      ...this.progressState,
      phase: 'Отменено',
      message: 'Операция остановлена пользователем',
      isScanning: false,
      canCancel: false
    };

    this.flushImmediately();
  }

  /**
   * Mark operation as successfully completed
   */
  finishSession(summaryMessage: string): void {
    this.abortController = null;
    this.progressState = {
      ...this.progressState,
      phase: 'Завершено',
      percentage: 100,
      message: summaryMessage,
      isScanning: false,
      canCancel: false
    };

    this.addLog('success', summaryMessage);
    this.flushImmediately();
  }

  /**
   * Mark operation as failed with error
   */
  failSession(errorMessage: string): void {
    this.abortController = null;
    this.progressState = {
      ...this.progressState,
      phase: 'Ошибка',
      message: errorMessage,
      isScanning: false,
      canCancel: false
    };

    this.addLog('error', errorMessage);
    this.flushImmediately();
  }

  /**
   * Update current task progress with throttling to protect UI thread
   */
  updateProgress(phase: string, percentage: number, message: string): void {
    const clampedPercent = Math.min(100, Math.max(0, Math.round(percentage)));
    this.progressState = {
      ...this.progressState,
      phase,
      percentage: clampedPercent,
      message
    };

    this.scheduleNotify();
  }

  info(message: string, details?: string): void {
    this.addLog('info', message, details);
  }

  success(message: string, details?: string): void {
    this.addLog('success', message, details);
  }

  warn(message: string, details?: string): void {
    this.addLog('warn', message, details);
  }

  error(message: string, details?: string): void {
    this.addLog('error', message, details);
    this.flushImmediately();
  }

  /**
   * Initializes the persistent file logger writing to plugin folder debug.log
   */
  async initFileLogger(app: App, pluginId: string = 'obsidian-semantic-gardener'): Promise<void> {
    this.app = app;
    this.pluginId = pluginId;
    const configDir = (this.app?.vault as any)?.configDir || '.obsidian';
    this.logFilePath = `${configDir}/plugins/${this.pluginId}/debug.log`;
    this.fileLoggerInitialized = true;

    try {
      if (this.app?.vault?.adapter) {
        const exists = await this.app.vault.adapter.exists(this.logFilePath);
        const header = `\n================================================================================\n` +
          `[${new Date().toISOString()}] Semantic Gardener Session Initialized\n` +
          `Target Plugin: ${this.pluginId} | Log: ${this.logFilePath}\n` +
          `================================================================================\n`;

        if (!exists) {
          await this.app.vault.adapter.write(this.logFilePath, header);
        } else {
          const stat = await this.app.vault.adapter.stat(this.logFilePath);
          if (stat && stat.size > LoggerService.MAX_FILE_SIZE_BYTES) {
            await this.app.vault.adapter.write(this.logFilePath, `[Log rotated due to 5MB size limit]\n` + header);
          } else {
            await this.app.vault.adapter.append(this.logFilePath, header);
          }
        }
      }
    } catch (err) {
      console.warn('Semantic Gardener: Failed to initialize file logger:', err);
    }

    this.processFileQueue();
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }

  getAbsolutePath(): string | null {
    if (!this.app?.vault?.adapter) return null;
    const adapter = this.app.vault.adapter as any;
    if (typeof adapter.getBasePath === 'function') {
      const base = adapter.getBasePath().replace(/\\/g, '/').replace(/\/+$/, '');
      return `${base}/${this.logFilePath}`;
    }
    return this.logFilePath;
  }

  async openLogFile(): Promise<void> {
    const absPath = this.getAbsolutePath();
    try {
      // 1. In Electron desktop, openPath natively opens the file in the default OS text editor
      const electron = (globalThis as any)?.require?.('electron') || (typeof window !== 'undefined' && (window as any)?.require?.('electron'));
      if (electron?.shell?.openPath && absPath) {
        const nativeWinPath = absPath.replace(/\//g, '\\');
        await electron.shell.openPath(nativeWinPath);
        return;
      }

      // 2. Obsidian's openWithDefaultApp expects a VAULT-RELATIVE path, NOT an absolute path
      if (typeof (this.app as any)?.openWithDefaultApp === 'function') {
        (this.app as any).openWithDefaultApp(this.logFilePath);
        return;
      }

      // 3. Fallback: Copy absolute path to clipboard
      if (absPath && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(absPath.replace(/\//g, '\\'));
        if (typeof (globalThis as any).Notice === 'function') {
          new (globalThis as any).Notice(`Путь к логу скопирован в буфер: ${absPath}`);
        }
      }
    } catch (err: any) {
      console.error('Semantic Gardener: Failed to open log file:', err);
    }
  }

  private addLog(level: LogLevel, message: string, details?: string): void {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      level,
      message,
      details
    };

    this.logs.push(entry);
    if (this.logs.length > LoggerService.MAX_LOGS) {
      this.logs.shift();
    }

    // Format file log line with phase & details
    const isoTime = now.toISOString();
    const phaseTag = this.progressState.phase && this.progressState.phase !== 'Ожидание'
      ? `[${this.progressState.phase} ${this.progressState.percentage}%]`
      : '';
    let fileLine = `[${isoTime}] [${level.toUpperCase()}] ${phaseTag} ${message}\n`;
    if (details) {
      fileLine += `    Stack / Details: ${details.replace(/\n/g, '\n    ')}\n`;
    }
    this.enqueueFileLog(fileLine);

    this.scheduleNotify();
  }

  private enqueueFileLog(line: string): void {
    this.writeQueue.push(line);
    this.processFileQueue();
  }

  private async processFileQueue(): Promise<void> {
    if (this.isWritingToFile || this.writeQueue.length === 0 || !this.app?.vault?.adapter || !this.fileLoggerInitialized) {
      return;
    }

    this.isWritingToFile = true;
    const chunk = this.writeQueue.join('');
    this.writeQueue = [];

    try {
      await this.app.vault.adapter.append(this.logFilePath, chunk);
    } catch (err) {
      try {
        await this.app.vault.adapter.write(this.logFilePath, chunk);
      } catch (writeErr) {
        console.warn('Semantic Gardener: Failed to write to debug.log:', writeErr);
      }
    } finally {
      this.isWritingToFile = false;
      if (this.writeQueue.length > 0) {
        setTimeout(() => this.processFileQueue(), 40);
      }
    }
  }

  clearLogs(): void {
    this.logs = [];
    this.flushImmediately();
  }

  getState(): { logs: LogEntry[]; progress: ProgressState } {
    return {
      logs: [...this.logs],
      progress: { ...this.progressState }
    };
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Emit initial state immediately
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Throttled notification (80-100ms) to prevent Svelte reactivity churn under rapid file loops
   */
  private scheduleNotify(): void {
    this.hasPendingNotification = true;
    if (this.throttleTimer !== null) return;

    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
      if (this.hasPendingNotification) {
        this.hasPendingNotification = false;
        this.emit();
      }
    }, 80);
  }

  /**
   * Immediate synchronous flush for important events (start, finish, cancel, error)
   */
  private flushImmediately(): void {
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    this.hasPendingNotification = false;
    this.emit();
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Semantic Gardener: Logger listener threw an error:', err);
      }
    }
  }
}
