import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as Svelte from 'svelte';
import ReviewModal from './components/ReviewModal.svelte';
import type SemanticGardenerPlugin from '../main';
import type { CandidateCluster, RefactorPlan } from '../types';

export const VIEW_TYPE_REFACTOR = 'semantic-gardener-review';

export class RefactorView extends ItemView {
  private component: any = null;

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

    const props = {
      plugin: this.plugin,
      clusters: this.plugin.candidateClusters,
      plans: this.plugin.refactorPlans,
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
    if (!this.component) return;

    const newProps = {
      clusters: [...this.plugin.candidateClusters],
      plans: { ...this.plugin.refactorPlans },
      isScanning: this.plugin.isScanning,
      logger: this.plugin.logger
    };

    if (typeof this.component.$set === 'function') {
      this.component.$set(newProps);
    } else {
      // Svelte 5 mounted component property sync
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
