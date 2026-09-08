export type SyncMutationResult = {
  id: string;
  status: 'applied' | 'duplicate' | 'conflict' | 'error';
  event?: unknown;
  serverEvent?: unknown;
  error?: string;
};

// Tracks which client-generated mutation ids have already been processed so a
// retried sync batch (e.g. after a dropped response) never re-applies the
// same mutation twice — the "server-side idempotency on mutation UUID"
// requirement from Section 11 (5.1).
export interface SyncRepository {
  findResult(mutationId: string): Promise<SyncMutationResult | undefined>;
  saveResult(result: SyncMutationResult): Promise<void>;
}

export class InMemorySyncRepository implements SyncRepository {
  private results = new Map<string, SyncMutationResult>();

  async findResult(mutationId: string) {
    return this.results.get(mutationId);
  }

  async saveResult(result: SyncMutationResult) {
    this.results.set(result.id, result);
  }
}
