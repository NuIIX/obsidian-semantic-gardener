<script lang="ts">
  import { onMount } from "svelte";
  import type {
    CandidateCluster,
    RefactorPlan,
    RefactorModification,
    ModificationMode,
  } from "../../types";
  import ClusterCard from "./ClusterCard.svelte";
  import DiffCard from "./DiffCard.svelte";
  import LogPanel from "./LogPanel.svelte";
  import type { LoggerService } from "../../core/logger";

  export let plugin: any;
  export let clusters: CandidateCluster[] = [];
  export let plans: Record<string, RefactorPlan> = {};
  export let isScanning: boolean = false;
  export let logger: LoggerService | undefined = undefined;
  export let onCancelScan: (() => void) | undefined = undefined;
  export let onScanVault: () => Promise<void>;
  export let onScanActiveNote: () => Promise<void>;
  export let onApplyPlan: (
    cluster: CandidateCluster,
    plan: RefactorPlan,
  ) => Promise<void>;
  export let onRejectCluster: (clusterId: string) => void;
  export let onUndoLast: () => Promise<void>;

  let selectedClusterId: string | null = null;
  let activeTab: "modifications" | "notePreview" = "modifications";
  let historyCount = 0;
  let activeViewMode: "list" | "detail" = "list";

  $: selectedCluster =
    clusters.find((c) => c.id === selectedClusterId) ||
    (clusters.length > 0 ? clusters[0] : null);
  $: selectedPlan = selectedCluster ? plans[selectedCluster.id] : null;

  $: if (!selectedClusterId && clusters.length > 0) {
    selectedClusterId = clusters[0].id;
  }

  function selectCluster(id: string) {
    selectedClusterId = id;
    activeViewMode = "detail";
  }

  function updateHistoryCount() {
    if (plugin?.transactionManager) {
      historyCount = plugin.transactionManager.getHistory().length;
    }
  }

  onMount(() => {
    updateHistoryCount();
  });

  async function handleApply() {
    if (!selectedCluster || !selectedPlan) return;
    await onApplyPlan(selectedCluster, selectedPlan);
    updateHistoryCount();
  }

  async function handleUndo() {
    await onUndoLast();
    updateHistoryCount();
  }
</script>

<div class="semantic-gardener-container">
  <div class="semantic-gardener-root">
    <!-- Top Navigation & Actions Bar -->
    <header class="sg-header">
      <div class="sg-header-left">
        <span class="sg-logo">🌱</span>
        <h2 class="sg-title">Semantic Gardener</h2>
        <span class="sg-badge"
          >{clusters.length}
          {clusters.length === 1 ? "кандидат" : "кандидатов"}</span
        >
      </div>

      <div class="sg-header-actions">
        <button
          class="sg-btn"
          on:click={onScanActiveNote}
          disabled={isScanning}
          title="Поиск дубликатов для текущей открытой заметки"
        >
          <span class="btn-icon">📄</span>
          <span class="btn-text">Активная заметка</span>
        </button>
        <button
          class="sg-btn sg-btn-primary"
          on:click={onScanVault}
          disabled={isScanning}
          title="Полное семантическое сканирование хранилища"
        >
          <span class="btn-icon">🔍</span>
          <span class="btn-text">Сканировать Vault</span>
        </button>

        <button
          class="sg-btn sg-btn-undo"
          on:click={handleUndo}
          disabled={historyCount === 0 || isScanning}
          title="Откатить последний рефакторинг в 1 клик"
        >
          <span class="btn-icon">↩</span>
          <span class="btn-text">Откат ({historyCount})</span>
        </button>
      </div>
    </header>

    <!-- Embedded Log & Progress Panel -->
    <LogPanel {logger} {onCancelScan} />

    <!-- Main Body: Responsive Two-column / Stacked Layout -->
    <div class="sg-body view-mode-{activeViewMode}">
      <!-- Left Column: Cluster Queue Sidebar -->
      <aside class="sg-sidebar">
        <div class="sidebar-header">
          <span>Очередь концептов</span>
          <span class="count-pill">{clusters.length}</span>
        </div>

        <div class="cluster-list">
          {#if clusters.length === 0}
            <div class="empty-clusters">
              {#if isScanning}
                <p>Выполняется сканирование хранилища...</p>
              {:else}
                <p>Дубликатов не найдено или хранилище еще не просканировано.</p>
                <button class="sg-btn sg-btn-sm" on:click={onScanVault}
                  >Запустить сканирование</button
                >
              {/if}
            </div>
          {:else}
            {#each clusters as cluster (cluster.id)}
              <ClusterCard
                {cluster}
                plan={plans[cluster.id]}
                isSelected={selectedCluster?.id === cluster.id}
                onSelect={() => selectCluster(cluster.id)}
              />
            {/each}
          {/if}
        </div>
      </aside>

      <!-- Right Column: Central Inspection & Refactoring Workspace -->
      <main class="sg-main-content">
        {#if !selectedCluster}
          <div class="empty-selection">
            <div class="empty-icon">🌿</div>
            <h3>Выберите концепт для ревизии</h3>
            <p>
              Выберите карточку из списка слева, чтобы просмотреть контекст,
              пословный diff и настроить микрохирургическую замену.
            </p>
          </div>
        {:else}
          <div class="concept-workspace">
            <!-- Narrow Navigation Row (visible only in narrow sidebar mode) -->
            <div class="narrow-nav-row">
              <button
                class="sg-btn sg-btn-sm"
                on:click={() => (activeViewMode = "list")}
                title="Вернуться к списку кандидатов"
              >
                ← К списку ({clusters.length})
              </button>
              <span class="narrow-concept-label"
                >{selectedPlan?.conceptTitle || "Детали концепта"}</span
              >
            </div>

            <!-- Gatekeeper Status Header -->
            <div class="concept-header-box">
              {#if selectedPlan}
                {#if selectedPlan.isDuplicate}
                  <div class="gatekeeper-banner approved">
                    <span class="banner-icon">✓</span>
                    <div>
                      <strong>LLM Gatekeeper:</strong> Смысловое дублирование подтверждено.
                      Сформирован план атомарной заметки и микрохирургических правок.
                    </div>
                  </div>
                {:else}
                  <div class="gatekeeper-banner rejected">
                    <span class="banner-icon">✕</span>
                    <div>
                      <strong>LLM Gatekeeper отклонил объединение:</strong>
                      {selectedPlan.rejectionReason ||
                        "Разные предметные области или контекст."}
                    </div>
                  </div>
                {/if}
              {:else}
                <div class="gatekeeper-banner pending">
                  <span class="banner-icon">⏳</span>
                  <div>
                    <strong>Анализ в процессе:</strong> Отправка кандидатов в Gemini...
                  </div>
                </div>
              {/if}

              <!-- Editable Concept Title -->
              <div class="concept-title-row">
                <label for="concept-title-input" class="concept-label"
                  >Название канонической заметки:</label
                >
                <input
                  id="concept-title-input"
                  type="text"
                  class="concept-title-input"
                  bind:value={selectedPlan.conceptTitle}
                  placeholder="Например: Закон Литтла"
                />
              </div>

              <!-- Tab switcher for Atomic Note vs Modifications -->
              <div class="tab-bar">
                <button
                  class="tab-btn {activeTab === 'modifications' ? 'active' : ''}"
                  on:click={() => (activeTab = "modifications")}
                >
                  ✏️ Замены в файлах ({selectedPlan?.modifications?.length || 0})
                </button>
                <button
                  class="tab-btn {activeTab === 'notePreview' ? 'active' : ''}"
                  on:click={() => (activeTab = "notePreview")}
                >
                  📝 Текст новой заметки
                </button>
              </div>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              {#if activeTab === "modifications"}
                <div class="modifications-list">
                  {#if selectedPlan?.modifications && selectedPlan.modifications.length > 0}
                    {#each selectedPlan.modifications as modification, idx (idx)}
                      <DiffCard
                        {modification}
                        breadcrumbs={selectedCluster.chunks.find(
                          (c) => c.filePath === modification.filePath,
                        )?.breadcrumbs || ""}
                      />
                    {/each}
                  {:else}
                    <div class="no-mods">
                      <p>
                        Для данного кластера нет предложенных правок (или кластер
                        был отклонен Gatekeeper).
                      </p>
                    </div>
                  {/if}
                </div>
              {:else}
                <!-- Atomic Note Preview & Editing -->
                <div class="note-preview-pane">
                  <label for="atomic-note-textarea" class="concept-label"
                    >Содержимое новой атомарной заметки (Markdown):</label
                  >
                  <textarea
                    id="atomic-note-textarea"
                    class="atomic-note-editor"
                    rows="12"
                    bind:value={selectedPlan.canonicalNoteMarkdown}
                    placeholder="# Определение&#10;&#10;Текст новой атомарной заметки..."
                  ></textarea>
                </div>
              {/if}
            </div>

            <!-- Bottom Action Controls -->
            <div class="concept-footer-actions">
              <button
                class="sg-btn sg-btn-danger"
                on:click={() => onRejectCluster(selectedCluster.id)}
                title="Исключить концепт из очереди"
              >
                Отклонить концепт
              </button>

              <div class="spacer"></div>

              <button
                class="sg-btn sg-btn-primary sg-btn-large"
                on:click={handleApply}
                disabled={!selectedPlan || !selectedPlan.isDuplicate}
                title="Создать заметку и применить выбранные замены в файлах с записью в журнал истории"
              >
                🚀 Применить рефакторинг
              </button>
            </div>
          </div>
        {/if}
      </main>
    </div>
  </div>
</div>

<style>
  .semantic-gardener-container {
    container-type: inline-size;
    container-name: gardener-root;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .semantic-gardener-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: var(--background-primary);
    color: var(--text-normal);
    font-family: var(--font-text);
    overflow: hidden;
  }

  /* Header */
  .sg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary-alt);
    flex-shrink: 0;
    gap: 10px;
    flex-wrap: wrap;
  }

  .sg-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .sg-logo {
    font-size: 1.4em;
  }

  .sg-title {
    margin: 0;
    font-size: 1.15em;
    font-weight: 700;
  }

  .sg-badge {
    font-size: 0.75em;
    padding: 2px 8px;
    border-radius: 12px;
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
  }

  .sg-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* Dynamic Buttons */
  .sg-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-primary);
    color: var(--text-normal);
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 500;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .sg-btn:hover:not(:disabled) {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .sg-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .sg-btn-primary {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    border-color: var(--interactive-accent);
  }

  .sg-btn-primary:hover:not(:disabled) {
    background-color: var(--interactive-accent-hover);
  }

  .sg-btn-danger {
    color: var(--text-error, #f85149);
    border-color: rgba(248, 81, 73, 0.4);
  }

  .sg-btn-danger:hover {
    background-color: rgba(248, 81, 73, 0.15);
  }

  .sg-btn-undo {
    border-color: var(--background-modifier-border);
  }

  .sg-btn-large {
    padding: 8px 18px;
    font-size: 0.95em;
    font-weight: 600;
  }

  .sg-btn-sm {
    padding: 4px 8px;
    font-size: 0.8em;
  }

  .btn-icon {
    font-size: 0.95em;
  }

  /* Body Layout */
  .sg-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Left Sidebar */
  .sg-sidebar {
    width: 320px;
    border-right: 1px solid var(--background-modifier-border);
    display: flex;
    flex-direction: column;
    background-color: var(--background-secondary);
    flex-shrink: 0;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    font-size: 0.85em;
    font-weight: 600;
    color: var(--text-muted);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .count-pill {
    padding: 1px 6px;
    border-radius: 10px;
    background-color: var(--background-modifier-border);
    font-size: 0.85em;
  }

  .cluster-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-clusters {
    padding: 30px 16px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.88em;
  }

  /* Main Workspace */
  .sg-main-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
  }

  .empty-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 40px;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 3em;
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .concept-workspace {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 16px 20px;
    gap: 16px;
  }

  .narrow-nav-row {
    display: none;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .narrow-concept-label {
    font-weight: 600;
    font-size: 0.9em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-accent);
  }

  .concept-header-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gatekeeper-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 0.88em;
    line-height: 1.4;
  }

  .gatekeeper-banner.approved {
    background-color: rgba(46, 160, 67, 0.15);
    border: 1px solid rgba(46, 160, 67, 0.35);
    color: var(--text-success, #3fb950);
  }

  .gatekeeper-banner.rejected {
    background-color: rgba(248, 81, 73, 0.15);
    border: 1px solid rgba(248, 81, 73, 0.35);
    color: var(--text-error, #f85149);
  }

  .gatekeeper-banner.pending {
    background-color: rgba(210, 153, 34, 0.15);
    border: 1px solid rgba(210, 153, 34, 0.35);
    color: var(--text-warning, #d29922);
  }

  .banner-icon {
    font-weight: 700;
    font-size: 1.2em;
    flex-shrink: 0;
  }

  .concept-title-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .concept-label {
    font-size: 0.85em;
    font-weight: 600;
    color: var(--text-muted);
  }

  .concept-title-input {
    width: 100%;
    padding: 8px 12px;
    font-size: 1.05em;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
    color: var(--text-normal);
  }

  .concept-title-input:focus {
    border-color: var(--interactive-accent);
    outline: none;
  }

  .tab-bar {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--background-modifier-border);
    padding-bottom: 4px;
    flex-wrap: wrap;
  }

  .tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.88em;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .tab-btn:hover {
    color: var(--text-normal);
  }

  .tab-btn.active {
    color: var(--interactive-accent);
    font-weight: 600;
    border-bottom: 2px solid var(--interactive-accent);
    border-radius: 0;
  }

  .tab-content {
    flex: 1;
  }

  .modifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .no-mods {
    padding: 20px;
    color: var(--text-muted);
    font-style: italic;
  }

  .note-preview-pane {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .atomic-note-editor {
    width: 100%;
    font-family: var(--font-monospace);
    font-size: 0.9em;
    line-height: 1.5;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
    color: var(--text-normal);
    resize: vertical;
  }

  .concept-footer-actions {
    display: flex;
    align-items: center;
    padding-top: 14px;
    border-top: 1px solid var(--background-modifier-border);
    margin-top: auto;
    flex-wrap: wrap;
    gap: 10px;
  }

  .spacer {
    flex: 1;
  }

  /* Container Queries for Adaptive Responsive Layout */
  @container gardener-root (max-width: 680px) {
    .sg-header {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 8px 12px;
    }

    .sg-header-actions {
      display: flex;
      width: 100%;
      gap: 6px;
    }

    .sg-header-actions .sg-btn {
      flex: 1 1 auto;
      padding: 6px 8px;
      font-size: 0.82em;
    }

    /* Stacked View: only show active view mode in narrow mode */
    .sg-body.view-mode-list .sg-main-content {
      display: none !important;
    }

    .sg-body.view-mode-detail .sg-sidebar {
      display: none !important;
    }

    .sg-body.view-mode-detail .sg-main-content {
      width: 100% !important;
    }

    .sg-body.view-mode-list .sg-sidebar {
      width: 100% !important;
      border-right: none;
    }

    .narrow-nav-row {
      display: flex !important;
    }
  }

  @container gardener-root (max-width: 440px) {
    .sg-header-actions .btn-text {
      font-size: 0.82em;
    }

    .concept-footer-actions {
      flex-direction: column-reverse;
      align-items: stretch;
      gap: 8px;
    }

    .concept-footer-actions .sg-btn {
      width: 100%;
      text-align: center;
      justify-content: center;
    }

    .concept-footer-actions .spacer {
      display: none;
    }
  }
</style>
