<script lang="ts">
  import type { CandidateCluster, RefactorPlan } from '../../types';

  export let cluster: CandidateCluster;
  export let plan: RefactorPlan | undefined = undefined;
  export let isSelected: boolean = false;
  export let onSelect: () => void;

  $: similarityPercent = Math.round(cluster.similarity * 100);
  $: fileNames = Array.from(new Set(cluster.chunks.map(c => c.filePath.split('/').pop() || c.filePath)));
  $: displayTitle = plan?.conceptTitle || (cluster.chunks[0]?.breadcrumbs ? cluster.chunks[0].breadcrumbs.replace(/[[\]]/g, '') : (fileNames[0]?.replace(/\.md$/, '') || 'Кластер'));
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
  class="cluster-card {isSelected ? 'selected' : ''} {plan && !plan.isDuplicate ? 'is-rejected' : ''}"
  on:click={onSelect}
>
  <div class="cluster-card-top">
    <div class="title-container">
      <span class="cluster-title">{displayTitle}</span>
    </div>
    <span class="similarity-badge" title="Косинусное сходство векторов">
      {similarityPercent}%
    </span>
  </div>

  <div class="cluster-meta">
    <span class="files-badge">📁 {fileNames.length} {fileNames.length === 1 ? 'файл' : fileNames.length < 5 ? 'файла' : 'файлов'}</span>
    
    {#if plan}
      {#if plan.isDuplicate}
        <span class="status-badge approved" title="Gatekeeper подтвердил смысловое дублирование">
          ✓ AI Подтверждено
        </span>
      {:else}
        <span class="status-badge rejected" title={plan.rejectionReason || 'Не дубликат'}>
          ✕ Отклонено AI
        </span>
      {/if}
    {:else}
      <span class="status-badge pending">
        ⏳ Не проверен
      </span>
    {/if}
  </div>

  <div class="cluster-files-list">
    {#each fileNames.slice(0, 3) as fn}
      <span class="file-tag">{fn}</span>
    {/each}
    {#if fileNames.length > 3}
      <span class="file-tag more">+{fileNames.length - 3}</span>
    {/if}
  </div>
</div>

<style>
  .cluster-card {
    padding: 12px;
    border-radius: 6px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cluster-card:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .cluster-card.selected {
    background-color: var(--background-primary-alt);
    border-color: var(--interactive-accent);
    box-shadow: 0 0 0 1px var(--interactive-accent);
  }

  .cluster-card.is-rejected {
    opacity: 0.6;
    border-left: 3px solid var(--text-error, #f85149);
  }

  .cluster-card-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
  }

  .cluster-title {
    font-weight: 600;
    font-size: 0.95em;
    color: var(--text-normal);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .similarity-badge {
    font-size: 0.78em;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 12px;
    background-color: rgba(46, 160, 67, 0.15);
    color: var(--text-success, #3fb950);
    white-space: nowrap;
  }

  .cluster-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75em;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .files-badge {
    color: var(--text-muted);
  }

  .status-badge {
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 500;
  }

  .status-badge.approved {
    background-color: rgba(46, 160, 67, 0.18);
    color: var(--text-success, #3fb950);
  }

  .status-badge.rejected {
    background-color: rgba(248, 81, 73, 0.18);
    color: var(--text-error, #f85149);
  }

  .status-badge.pending {
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
  }

  .cluster-files-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .file-tag {
    font-size: 0.72em;
    color: var(--text-muted);
    background-color: var(--background-primary);
    padding: 1px 6px;
    border-radius: 3px;
    border: 1px solid var(--background-modifier-border);
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-tag.more {
    color: var(--text-faint);
  }
</style>
