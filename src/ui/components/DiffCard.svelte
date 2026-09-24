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

  $: sectionHierarchy = (() => {
    if (!breadcrumbs) return '';
    const clean = breadcrumbs.replace(/^\[|\]$/g, '').trim();
    if (clean.startsWith(modification.filePath)) {
      const rest = clean.slice(modification.filePath.length).replace(/^[\s>]+/, '').trim();
      return rest;
    }
    const filename = modification.filePath.split('/').pop() || '';
    if (clean === modification.filePath || clean === filename || clean === filename.replace(/\.md$/, '')) {
      return '';
    }
    return clean;
  })();
</script>

<div class="diff-card {modification.selectedMode === 'skip' ? 'is-skipped' : ''}">
  <div class="diff-card-header">
    <div class="file-info">
      <div class="file-path-row">
        <span class="file-icon">📄</span>
        {#if onOpenFile}
          <button 
            type="button"
            class="file-path clickable" 
            on:click={() => onOpenFile?.(modification.filePath)}
            title="Кликните, чтобы открыть заметку в новой вкладке Obsidian ({modification.filePath})"
          >
            {modification.filePath}
          </button>
        {:else}
          <span class="file-path" title={modification.filePath}>
            {modification.filePath}
          </span>
        {/if}

        <div class="file-actions">
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
      </div>

      {#if sectionHierarchy}
        <div class="file-breadcrumbs" title={breadcrumbs}>
          <span class="breadcrumb-arrow">↳</span>
          <span class="breadcrumb-label">Раздел:</span>
          <span class="breadcrumb-text">{sectionHierarchy}</span>
        </div>
      {:else if breadcrumbs && !breadcrumbs.includes(modification.filePath)}
        <div class="file-breadcrumbs" title={breadcrumbs}>
          <span class="breadcrumb-arrow">↳</span>
          <span class="breadcrumb-text">{breadcrumbs}</span>
        </div>
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
    overflow: hidden;
  }

  .diff-card.is-skipped {
    opacity: 0.65;
    border-style: dashed;
  }

  .diff-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 14px;
    border-bottom: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary-alt);
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    flex-wrap: wrap;
    gap: 10px;
    min-width: 0;
  }

  .file-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    flex: 1 1 300px;
    min-width: 0;
    max-width: 100%;
  }

  .file-path-row {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .file-icon {
    font-size: 1.1em;
    flex-shrink: 0;
    line-height: 1.4;
    margin-top: 1px;
  }

  .file-path {
    font-weight: 600;
    color: var(--text-normal);
    line-height: 1.4;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
    text-align: left;
    min-width: 0;
    flex: 1 1 auto;
  }

  button.file-path {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    display: inline;
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

  .file-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .file-action-btn {
    font-size: 0.75rem;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    white-space: nowrap;
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
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 0.8em;
    color: var(--text-muted);
    font-family: var(--font-monospace);
    background-color: var(--background-primary);
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.35;
    min-width: 0;
    max-width: 100%;
  }

  .breadcrumb-arrow {
    color: var(--text-faint);
    font-weight: bold;
    flex-shrink: 0;
  }

  .breadcrumb-label {
    color: var(--text-faint);
    font-size: 0.9em;
    flex-shrink: 0;
  }

  .breadcrumb-text {
    color: var(--text-accent);
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .mode-toggles {
    display: flex;
    gap: 4px;
    background-color: var(--background-primary);
    padding: 3px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
    align-self: flex-start;
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
