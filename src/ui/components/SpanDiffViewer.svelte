<script lang="ts">
  import type { Change } from 'diff';
  import { diffWordsUnicode } from '../../utils/diff-helper';

  export let originalText: string = '';
  export let newText: string = '';

  let diffParts: Change[] = [];

  $: {
    if (!originalText && !newText) {
      diffParts = [];
    } else if (originalText === newText) {
      diffParts = [{ value: originalText, added: false, removed: false }];
    } else {
      diffParts = diffWordsUnicode(originalText || '', newText || '');
    }
  }
</script>

<div class="span-diff-container">
  <div class="diff-block">
    {#each diffParts as part}
      {#if part.added}
        <span class="diff-added" title="Добавленный текст">{part.value}</span>
      {:else if part.removed}
        <span class="diff-removed" title="Удаляемый текст">{part.value}</span>
      {:else}
        <span class="diff-unchanged">{part.value}</span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .span-diff-container {
    font-family: var(--font-text);
    font-size: 0.9em;
    line-height: 1.6;
    padding: 10px 14px;
    background-color: var(--background-primary-alt);
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    overflow-x: auto;
  }

  .diff-block {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .diff-added {
    background-color: rgba(46, 160, 67, 0.22);
    color: var(--text-success, #3fb950);
    text-decoration: none;
    border-radius: 3px;
    padding: 1px 3px;
    border-bottom: 2px solid rgba(46, 160, 67, 0.6);
  }

  .diff-removed {
    background-color: rgba(248, 81, 73, 0.22);
    color: var(--text-error, #f85149);
    text-decoration: line-through;
    border-radius: 3px;
    padding: 1px 3px;
    opacity: 0.85;
  }

  .diff-unchanged {
    color: var(--text-normal);
  }
</style>
