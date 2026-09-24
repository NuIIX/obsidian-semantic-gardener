<script lang="ts">
  import { compareNotes, type NoteComparisonResult } from '../../core/note-comparer';

  export let filePathA: string;
  export let filePathB: string;
  export let contentA: string = '';
  export let contentB: string = '';
  export let onClose: () => void;
  export let onOpenFile: (filePath: string) => void;
  export let onDeleteFile: (filePath: string) => Promise<void>;

  $: comparison = compareNotes(contentA, contentB);
  $: fileNameA = filePathA.split('/').pop() || filePathA;
  $: fileNameB = filePathB.split('/').pop() || filePathB;

  let isDeleting = false;
  let confirmDeleteFile: string | null = null;

  async function handleDelete(filePath: string) {
    if (confirmDeleteFile !== filePath) {
      confirmDeleteFile = filePath;
      return;
    }
    isDeleting = true;
    try {
      await onDeleteFile(filePath);
      onClose();
    } finally {
      isDeleting = false;
      confirmDeleteFile = null;
    }
  }
</script>

<div 
  class="note-diff-overlay" 
  role="dialog" 
  aria-modal="true"
  tabindex="-1"
  on:click|self={onClose} 
  on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
>
  <div class="note-diff-modal">
    <div class="modal-header">
      <div class="header-titles">
        <h3>📑 Сравнение заметок целиком</h3>
        <div class="similarity-pill {comparison.similarityPercent >= 85 ? 'high-similarity' : ''}">
          {comparison.isExactDuplicate ? '✓ 100% Точный дубликат' : `Сходство: ${comparison.similarityPercent}%`}
        </div>
      </div>
      <button class="close-btn" on:click={onClose} title="Закрыть">✕</button>
    </div>

    <div class="modal-meta-bar">
      <div class="file-column">
        <strong>Заметка А:</strong> 
        <span class="file-name-tag" title={filePathA}>{fileNameA}</span>
        <button class="sg-btn sg-btn-sm" on:click={() => onOpenFile(filePathA)} title="Открыть во вкладке">
          📂 Открыть А
        </button>
        <button 
          class="sg-btn sg-btn-danger sg-btn-sm" 
          disabled={isDeleting}
          on:click={() => handleDelete(filePathA)}
          title="Переместить заметку А в корзину"
        >
          {confirmDeleteFile === filePathA ? '⚠️ Подтвердить удаление А?' : '🗑 Удалить А'}
        </button>
      </div>

      <div class="file-column">
        <strong>Заметка Б:</strong> 
        <span class="file-name-tag" title={filePathB}>{fileNameB}</span>
        <button class="sg-btn sg-btn-sm" on:click={() => onOpenFile(filePathB)} title="Открыть во вкладке">
          📂 Открыть Б
        </button>
        <button 
          class="sg-btn sg-btn-danger sg-btn-sm" 
          disabled={isDeleting}
          on:click={() => handleDelete(filePathB)}
          title="Переместить заметку Б в корзину"
        >
          {confirmDeleteFile === filePathB ? '⚠️ Подтвердить удаление Б?' : '🗑 Удалить Б'}
        </button>
      </div>
    </div>

    <div class="stats-bar">
      <span>Строк в А: {comparison.totalLinesA}</span>
      <span>Строк в Б: {comparison.totalLinesB}</span>
      <span>Одинаковых строк: {comparison.matchingLines}</span>
      {#if comparison.isExactDuplicate}
        <span class="exact-badge">Рекомендуется удалить одну из заметок во избежание дублирования в поиске</span>
      {/if}
    </div>

    <div class="diff-content-scroll">
      <div class="diff-lines-container">
        {#each comparison.changes as change}
          <div class="diff-line-block {change.added ? 'line-added' : change.removed ? 'line-removed' : 'line-unchanged'}">
            <span class="line-sign">{change.added ? '+' : change.removed ? '-' : ' '}</span>
            <pre class="line-text">{change.value}</pre>
          </div>
        {/each}
      </div>
    </div>

    <div class="modal-footer">
      <div class="footer-hint">
        Зеленый (+) = только в Заметке Б, Красный (-) = только в Заметке А, Обычный = одинаковый текст.
      </div>
      <button class="sg-btn" on:click={onClose}>Закрыть</button>
    </div>
  </div>
</div>

<style>
  .note-diff-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .note-diff-modal {
    width: 90vw;
    max-width: 1100px;
    height: 85vh;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header-titles {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-titles h3 {
    margin: 0;
    font-size: 1.15rem;
  }

  .similarity-pill {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    background: var(--background-modifier-border);
    color: var(--text-muted);
  }

  .similarity-pill.high-similarity {
    background: rgba(46, 204, 113, 0.2);
    color: var(--text-success, #2ecc71);
    border: 1px solid rgba(46, 204, 113, 0.4);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-muted);
  }

  .close-btn:hover {
    color: var(--text-normal);
  }

  .modal-meta-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 12px 20px;
    background: var(--background-secondary-alt);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  @media (max-width: 650px) {
    .modal-meta-bar {
      grid-template-columns: 1fr;
      gap: 10px;
    }
  }

  .file-column {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }

  .file-name-tag {
    font-family: var(--font-monospace);
    font-size: 0.85rem;
    color: var(--text-accent);
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.35;
    min-width: 0;
  }

  .stats-bar {
    display: flex;
    gap: 20px;
    padding: 8px 20px;
    font-size: 0.8rem;
    color: var(--text-muted);
    background: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    align-items: center;
  }

  .exact-badge {
    color: var(--text-warning, #f39c12);
    font-weight: 600;
  }

  .diff-content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    background: var(--background-primary);
  }

  .diff-lines-container {
    display: flex;
    flex-direction: column;
    font-family: var(--font-monospace);
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .diff-line-block {
    display: flex;
    padding: 2px 6px;
    border-radius: 4px;
    margin-bottom: 2px;
  }

  .line-sign {
    width: 20px;
    user-select: none;
    font-weight: bold;
  }

  .line-text {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    flex: 1;
    font-family: inherit;
    background: transparent;
    padding: 0;
  }

  .line-added {
    background: rgba(46, 204, 113, 0.15);
    color: var(--text-success, #27ae60);
  }

  .line-removed {
    background: rgba(231, 76, 60, 0.15);
    color: var(--text-error, #c0392b);
    text-decoration: line-through;
  }

  .line-unchanged {
    color: var(--text-normal);
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: var(--background-secondary);
    border-top: 1px solid var(--background-modifier-border);
  }

  .footer-hint {
    font-size: 0.8rem;
    color: var(--text-muted);
  }
</style>
