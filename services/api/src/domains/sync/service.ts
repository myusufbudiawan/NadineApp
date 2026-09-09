import { assertBabyAccess } from '../../common/auth/baby-access.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { ConflictError } from '../care-events/service.js';
import type { CareEventsService } from '../care-events/service.js';
import type { GrowthService } from '../growth/service.js';
import { SharingService } from '../sharing/service.js';
import { SyncMutation } from './schema.js';
import { SyncMutationResult, SyncRepository } from './repository.js';

// Applies a batch of offline-queued mutations (FR-017 / Section 11 5.1).
// Each mutation is resolved independently and in order so a caller always
// gets a per-mutation outcome back — one failed/conflicting mutation never
// blocks the rest of the batch from syncing.
export class SyncService {
  constructor(
    private careEvents: CareEventsService,
    private repository: SyncRepository,
    private babyProfile: BabyProfileService,
    private sharing: SharingService,
    private growth: GrowthService,
  ) {}

  async apply(actorId: string, actorEmail: string, mutations: SyncMutation[]): Promise<SyncMutationResult[]> {
    const results: SyncMutationResult[] = [];
    for (const mutation of mutations) {
      results.push(await this.applyOne(actorId, actorEmail, mutation));
    }
    return results;
  }

  private async applyOne(
    actorId: string,
    actorEmail: string,
    mutation: SyncMutation,
  ): Promise<SyncMutationResult> {
    const cached = await this.repository.findResult(mutation.id);
    if (cached) return { ...cached, status: 'duplicate' };

    try {
      await assertBabyAccess(
        { babyProfile: this.babyProfile, sharing: this.sharing },
        actorId,
        actorEmail,
        mutation.payload.babyId,
        'write',
      );
      const result = await this.resolve(actorId, mutation);
      await this.repository.saveResult(result);
      return result;
    } catch (error) {
      if (error instanceof ConflictError) {
        const conflict: SyncMutationResult = {
          id: mutation.id,
          status: 'conflict',
          serverEvent: error.current,
        };
        // Conflicts are not cached as terminal — the caller must resolve and
        // resubmit; a resubmission with the right expectedUpdatedAt should
        // be retried, not rejected as a stale duplicate.
        return conflict;
      }
      const failure: SyncMutationResult = {
        id: mutation.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown sync error',
      };
      return failure;
    }
  }

  private async resolve(actorId: string, mutation: SyncMutation): Promise<SyncMutationResult> {
    switch (mutation.type) {
      case 'care-event': {
        const { babyId, ...input } = mutation.payload;
        const event = await this.careEvents.create(actorId, babyId, input);
        return { id: mutation.id, status: 'applied', event };
      }
      case 'care-event-update': {
        const { babyId, id, ...patch } = mutation.payload;
        const event = await this.careEvents.update(actorId, babyId, id, patch);
        return { id: mutation.id, status: 'applied', event };
      }
      case 'care-event-delete': {
        const { babyId, id } = mutation.payload;
        const event = await this.careEvents.remove(actorId, babyId, id);
        return { id: mutation.id, status: 'applied', event };
      }
      case 'growth-measurement': {
        const { babyId, ...input } = mutation.payload;
        const measurement = await this.growth.create(actorId, babyId, input);
        return { id: mutation.id, status: 'applied', event: measurement };
      }
    }
  }
}
