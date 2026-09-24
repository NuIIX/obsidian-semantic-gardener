<script lang="ts">
  import type { RefactorModification, ModificationMode } from '../../types';
  import SpanDiffViewer from './SpanDiffViewer.svelte';

  export let modification: RefactorModification;
  export let breadcrumbs: string = '';
  export let onOpenFile: ((filePath: string) => void) | undefined = undefined;
  export let onCompareNotes: ((filePath: string) => void) | undefined = undefined;

  function setMode(mode: ModificationMode) {
    modification.selectedMode = mode;
  }

  $: currentReplacement = 
    modification.selectedMode === 'inline' 
      ? modification.suggestedInlineSpan 
      : modification.selectedMode === 'transclusion' 
        ? modification.transclusionSpan 
        : modification.originalSpan;
</script>

<div class="diff-card {modification.selectedMode === 'skip' ? 'is-skipped' : ''}">
  <div class="diff-card-header">
    <div class="file-info">
      <span class="file-icon">📄</span>
      {#if onOpenFile}
        <button 
          type="button"
          class="file-path clickable" 
          on:click={() => onOpenFile?.(modification.filePath)}
          title="Кликните, чтобы открыть заметку в новой вкладке Obsidian"
        >
          {modification.filePath}
        </button>
      {:else}
        <span class="file-path">
          {modification.filePath}
        </span>
      {/if}
      {#if breadcrumbs}
        <span class="file-breadcrumbs">{breadcrumbs}</span>
      {/if}
      {#if onOpenFile}
        <button 
          type="button" 
          class="file-action-btn" 
          on:click={() => onOpenFile?.(modification.filePath)}
          title="Открыть заметку в новой вкладке Obsidian"
        >
          📂 Открыть
        </button>
      {/if}
      {#if onCompareNotes}
        <button 
          type="button" 
          class="file-action-btn compare-btn" 
          on:click={() => onCompareNotes?.(modification.filePath)}
          title="Сравнить эту заметку целиком с другой заметкой из этого концепта"
        >
          📑 Сравнить целиком
        </button>
      {/if}
    </div>

    <div class="mode-toggles">
      <button 
        type="button"
        class="mode-btn {modification.selectedMode === 'inline' ? 'active' : ''}" 
        on:click={() => setMode('inline')}
        title="Встроить инлайн-ссылку с сохранением авторского стиля"
      >
        🔗 Инлайн [[Ссылка]]
      </button>

      <button 
        type="button"
        class="mode-btn {modification.selectedMode === 'transclusion' ? 'active' : ''}" 
        on:click={() => setMode('transclusion')}
        title="Заменить на трансклюзию ![[Концепт]]"
      >
        📑 ![[Трансклюзия]]
      </button>

      <button 
        type="button"
        class="mode-btn {modification.selectedMode === 'skip' ? 'active skip-active' : ''}" 
        on:click={() => setMode('skip')}
        title="Не изменять этот файл"
      >
        ⏭ Пропустить
      </button>
    </div>
  </div>

  <div class="diff-card-body">
    {#if modification.selectedMode === 'skip'}
      <div class="skip-notice">
        <span>Файл не будет изменен. Исходный фрагмент сохраняется:</span>
        <div class="original-preview">{modification.originalSpan}</div>
      </div>
    {:else}
      <div class="diff-section">
        <SpanDiffViewer 
          originalText={modification.originalSpan} 
          newText={currentReplacement} 
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .diff-card {
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    background-color: var(--background-secondary);
    margin-bottom: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: border-color 0.2s ease, opacity 0.2s ease;
  }

  .diff-card.is-skipped {
    opacity: 0.65;
    border-style: dashed;
  }

  .diff-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary-alt);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9em;
  }

  .file-icon {
    font-size: 1.1em;
  }

  .file-path {
    font-weight: 600;
    color: var(--text-normal);
  }

  button.file-path {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    text-align: left;
  }

  .file-path.clickable {
    cursor: pointer;
    color: var(--text-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .file-path.clickable:hover {
    color: var(--text-accent-hover, var(--text-accent));
  }

  .file-action-btn {
    font-size: 0.75rem;
    padding: 2px 7px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .file-action-btn:hover {
    color: var(--text-normal);
    background: var(--background-modifier-hover);
  }

  .file-action-btn.compare-btn {
    border-color: rgba(52, 152, 219, 0.4);
    color: var(--text-accent);
  }

  .file-breadcrumbs {
    font-size: 0.8em;
    color: var(--text-muted);
    font-family: var(--font-monospace);
  }

  .mode-toggles {
    display: flex;
    gap: 4px;
    background-color: var(--background-primary);
    padding: 3px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
  }

  .mode-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.78em;
    padding: 4px 9px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-btn:hover {
    color: var(--text-normal);
    background-color: var(--background-modifier-hover);
  }

  .mode-btn.active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    font-weight: 600;
  }

  .mode-btn.skip-active {
    background-color: var(--background-modifier-box-shadow, #555);
    color: var(--text-normal);
  }

  .diff-card-body {
    padding: 12px 14px;
  }

  .skip-notice {
    font-size: 0.85em;
    color: var(--text-muted);
    padding: 8px;
  }

  .original-preview {
    margin-top: 6px;
    font-style: italic;
    color: var(--text-normal);
    padding: 6px 10px;
    background-color: var(--background-primary);
    border-radius: 4px;
  }
</style>
