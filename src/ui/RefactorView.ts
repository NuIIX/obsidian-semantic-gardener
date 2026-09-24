import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as Svelte from 'svelte';
import { writable, type Writable } from 'svelte/store';
import ReviewModal from './components/ReviewModal.svelte';
import type SemanticGardenerPlugin from '../main';
import type { CandidateCluster, RefactorPlan } from '../types';

export const VIEW_TYPE_REFACTOR = 'semantic-gardener-review';

export interface GardenerViewState {
  clusters: CandidateCluster[];
  plans: Record<string, RefactorPlan>;
  isScanning: boolean;
}

export class RefactorView extends ItemView {
  private component: any = null;
  private store!: Writable<GardenerViewState>;

  constructor(leaf: WorkspaceLeaf, private plugin: SemanticGardenerPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_REFACTOR;
  }

  getDisplayText(): string {
    return 'Semantic Gardener';
  }

  getIcon(): string {
    return 'sprout';
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl;
    container.empty();

    this.store = writable<GardenerViewState>({
      clusters: [...this.plugin.candidateClusters],
      plans: { ...this.plugin.refactorPlans },
      isScanning: this.plugin.isScanning
    });

    const props = {
      plugin: this.plugin,
      store: this.store,
      clusters: [...this.plugin.candidateClusters],
      plans: { ...this.plugin.refactorPlans },
      isScanning: this.plugin.isScanning,
      logger: this.plugin.logger,
      onCancelScan: () => {
        this.plugin.cancelScan();
        this.updateProps();
      },
      onScanVault: async () => {
        await this.plugin.scanVault();
        this.updateProps();
      },
      onScanActiveNote: async () => {
        await this.plugin.scanActiveNote();
        this.updateProps();
      },
      onAnalyzeCluster: async (cluster: CandidateCluster) => {
        await this.plugin.analyzeCluster(cluster);
        this.updateProps();
      },
      onApplyPlan: async (cluster: CandidateCluster, plan: RefactorPlan) => {
        await this.plugin.applyRefactorPlan(cluster, plan);
        this.updateProps();
      },
      onRejectCluster: (clusterId: string) => {
        this.plugin.rejectCluster(clusterId);
        this.updateProps();
      },
      onUndoLast: async () => {
        await this.plugin.transactionManager.undoLast();
        this.updateProps();
      }
    };

    if (typeof (Svelte as any).mount === 'function') {
      this.component = (Svelte as any).mount(ReviewModal, {
        target: container,
        props
      });
    } else {
      this.component = new (ReviewModal as any)({
        target: container,
        props
      });
    }
  }

  updateProps() {
    const newProps = {
      clusters: [...this.plugin.candidateClusters],
      plans: { ...this.plugin.refactorPlans },
      isScanning: this.plugin.isScanning,
      logger: this.plugin.logger
    };

    if (this.store) {
      this.store.set({
        clusters: newProps.clusters,
        plans: newProps.plans,
        isScanning: newProps.isScanning
      });
    }

    if (!this.component) return;

    if (typeof this.component.updateState === 'function') {
      this.component.updateState(
        newProps.clusters,
        newProps.plans,
        newProps.isScanning,
        newProps.logger
      );
    } else if (typeof this.component.$set === 'function') {
      this.component.$set(newProps);
    } else {
      Object.assign(this.component, newProps);
    }
  }

  async onClose(): Promise<void> {
    if (this.component) {
      if (typeof (Svelte as any).unmount === 'function') {
        (Svelte as any).unmount(this.component);
      } else if (typeof this.component.$destroy === 'function') {
        this.component.$destroy();
      }
      this.component = null;
    }
  }
}
