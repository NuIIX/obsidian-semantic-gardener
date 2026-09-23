<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import type { LogEntry, ProgressState } from '../../types';
  import type { LoggerService } from '../../core/logger';

  export let logger: LoggerService | undefined = undefined;
  export let onCancelScan: (() => void) | undefined = undefined;

  let logs: LogEntry[] = [];
  let progress: ProgressState = {
    phase: 'Ожидание',
    percentage: 0,
    message: 'Готов к работе',
    isScanning: false,
    canCancel: false
  };

  let isExpanded = false;
  let logContainerEl: HTMLElement | null = null;
  let autoScroll = true;

  onMount(() => {
    if (logger) {
      const unsubscribe = logger.subscribe((state) => {
        logs = state.logs;
        progress = state.progress;

        // Auto-expand drawer when a new scan starts
        if (progress.isScanning && !isExpanded) {
          isExpanded = true;
        }
      });
      return unsubscribe;
    }
  });

  afterUpdate(() => {
    if (autoScroll && logContainerEl && isExpanded) {
      logContainerEl.scrollTop = logContainerEl.scrollHeight;
    }
  });

  function handleScroll() {
    if (!logContainerEl) return;
    const threshold = 30;
    const isAtBottom = logContainerEl.scrollHeight - logContainerEl.scrollTop - logContainerEl.clientHeight < threshold;
    autoScroll = isAtBottom;
  }

  function handleClear(e: MouseEvent) {
    e.stopPropagation();
    if (logger) {
      logger.clearLogs();
    }
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
    if (isExpanded) {
      autoScroll = true;
    }
  }

  async function handleOpenLogFile(e: MouseEvent) {
    e.stopPropagation();
    if (logger) {
      await logger.openLogFile();
    }
  }
</script>

<div class="sg-log-panel-wrapper">
  <!-- 1. Progress Bar & Real-time Status -->
  <div class="sg-progress-section" class:active={progress.isScanning}>
    <div class="sg-progress-header">
      <div class="sg-progress-status-box">
        {#if progress.isScanning}
          <span class="sg-pulse-indicator"></span>
        {:else if progress.percentage === 100}
          <span class="sg-done-icon">✓</span>
        {/if}
        <span class="sg-phase-tag">{progress.phase}</span>
        <span class="sg-progress-text" title={progress.message}>{progress.message}</span>
      </div>

      <div class="sg-progress-controls">
        <span class="sg-percentage-badge">{progress.percentage}%</span>

        {#if progress.isScanning && progress.canCancel && onCancelScan}
          <button
            class="sg-btn-cancel"
            on:click={onCancelScan}
            title="Остановить выполнение операции"
          >
            ⏹ Отмена
          </button>
        {/if}
      </div>
    </div>

    <!-- Animated Progress Track -->
    <div class="sg-progress-track">
      <div
        class="sg-progress-fill"
        class:is-active={progress.isScanning}
        class:is-done={progress.percentage === 100}
        style="width: {progress.percentage}%"
      ></div>
    </div>
  </div>

  <!-- 2. Collapsible Log Console Drawer -->
  <div class="sg-console-drawer">
    <div class="sg-console-header">
      <button
        class="sg-toggle-btn"
        on:click={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <span class="sg-toggle-arrow">{isExpanded ? '▼' : '▶'}</span>
        <span class="sg-console-title">Журнал процессов</span>
        <span class="sg-log-count-pill">{logs.length}</span>
      </button>

      <div class="sg-console-header-actions">
        <button
          class="sg-btn-open-log"
          on:click={handleOpenLogFile}
          title="Открыть файл debug.log с историей и строками ошибок"
        >
          📄 debug.log
        </button>

        {#if logs.length > 0}
          <button
            class="sg-btn-clear-logs"
            on:click={handleClear}
            title="Очистить историю логов"
          >
            Очистить
          </button>
        {/if}
      </div>
    </div>

    {#if isExpanded}
      <div
        class="sg-console-body"
        bind:this={logContainerEl}
        on:scroll={handleScroll}
      >
        {#if logs.length === 0}
          <div class="sg-log-empty">Журнал пуст. Запустите операцию для отображения событий.</div>
        {:else}
          {#each logs as log (log.id)}
            <div class="sg-log-entry log-{log.level}">
              <span class="sg-log-time">{log.timestamp}</span>
              <span class="sg-log-level">[{log.level.toUpperCase()}]</span>
              <span class="sg-log-msg">{log.message}</span>
              {#if log.details}
                <div class="sg-log-details">{log.details}</div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .sg-log-panel-wrapper {
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    display: flex;
    flex-direction: column;
    font-size: 0.85em;
  }

  /* Progress Section */
  .sg-progress-section {
    padding: 8px 14px 10px 14px;
    background-color: var(--background-secondary-alt);
    transition: background-color 0.2s ease;
  }

  .sg-progress-section.active {
    background-color: rgba(var(--interactive-accent-rgb, 100, 100, 255), 0.06);
  }

  .sg-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .sg-progress-status-box {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 200px;
    min-width: 0;
  }

  .sg-pulse-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--interactive-accent);
    box-shadow: 0 0 8px var(--interactive-accent);
    animation: sg-pulse 1.2s infinite ease-in-out;
    flex-shrink: 0;
  }

  .sg-done-icon {
    color: var(--text-success, #3fb950);
    font-weight: 700;
    flex-shrink: 0;
  }

  @keyframes sg-pulse {
    0%, 100% { transform: scale(0.9); opacity: 0.6; }
    50% { transform: scale(1.3); opacity: 1; }
  }

  .sg-phase-tag {
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    background-color: var(--background-modifier-border);
    color: var(--text-normal);
    font-size: 0.85em;
    white-space: nowrap;
  }

  .sg-progress-text {
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.9em;
  }

  .sg-progress-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .sg-percentage-badge {
    font-weight: 700;
    font-size: 0.9em;
    color: var(--interactive-accent);
    min-width: 38px;
    text-align: right;
    font-family: var(--font-monospace);
  }

  .sg-btn-cancel {
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid rgba(248, 81, 73, 0.4);
    background-color: rgba(248, 81, 73, 0.1);
    color: var(--text-error, #f85149);
    cursor: pointer;
    font-size: 0.82em;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .sg-btn-cancel:hover {
    background-color: rgba(248, 81, 73, 0.25);
    border-color: var(--text-error, #f85149);
  }

  /* Progress Track & Fill */
  .sg-progress-track {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background-color: var(--background-modifier-border);
    overflow: hidden;
    position: relative;
  }

  .sg-progress-fill {
    height: 100%;
    background-color: var(--interactive-accent);
    border-radius: 3px;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sg-progress-fill.is-active {
    background: linear-gradient(90deg, var(--interactive-accent), #48bb78);
  }

  .sg-progress-fill.is-done {
    background-color: var(--text-success, #3fb950);
  }

  /* Console Drawer */
  .sg-console-drawer {
    border-top: 1px solid var(--background-modifier-border);
  }

  .sg-console-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 12px;
    background: transparent;
  }

  .sg-toggle-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 0.82em;
    padding: 4px 0;
    transition: color 0.15s ease;
  }

  .sg-toggle-btn:hover {
    color: var(--text-normal);
  }

  .sg-toggle-arrow {
    font-size: 0.75em;
    width: 10px;
  }

  .sg-console-title {
    font-weight: 500;
  }

  .sg-log-count-pill {
    padding: 0 5px;
    border-radius: 8px;
    background-color: var(--background-modifier-border);
    font-size: 0.85em;
    color: var(--text-muted);
  }

  .sg-console-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sg-btn-open-log {
    padding: 1px 6px;
    border-radius: 3px;
    border: 1px solid var(--background-modifier-border);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.78em;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sg-btn-open-log:hover {
    background-color: var(--background-modifier-hover);
    color: var(--interactive-accent);
    border-color: var(--interactive-accent);
  }

  .sg-btn-clear-logs {
    padding: 1px 6px;
    border-radius: 3px;
    border: 1px solid var(--background-modifier-border);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.78em;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sg-btn-clear-logs:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .sg-console-body {
    max-height: 150px;
    overflow-y: auto;
    padding: 6px 12px;
    background-color: var(--background-primary-alt);
    font-family: var(--font-monospace);
    font-size: 0.82em;
    line-height: 1.45;
    border-top: 1px solid var(--background-modifier-border);
  }

  .sg-log-empty {
    color: var(--text-muted);
    font-style: italic;
    padding: 6px 0;
  }

  .sg-log-entry {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    padding: 2px 0;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.04);
  }

  .sg-log-time {
    color: var(--text-muted);
    opacity: 0.75;
    font-size: 0.9em;
  }

  .sg-log-level {
    font-weight: 600;
    font-size: 0.85em;
  }

  .sg-log-msg {
    word-break: break-word;
    flex: 1 1 auto;
  }

  .log-info .sg-log-level { color: var(--text-accent); }
  .log-success .sg-log-level { color: var(--text-success, #3fb950); }
  .log-warn .sg-log-level { color: var(--text-warning, #d29922); }
  .log-error .sg-log-level { color: var(--text-error, #f85149); }
  .log-progress .sg-log-level { color: var(--text-accent); }

  .sg-log-details {
    width: 100%;
    margin-left: 18px;
    font-size: 0.88em;
    color: var(--text-muted);
    white-space: pre-wrap;
  }
</style>
