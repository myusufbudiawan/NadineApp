import { z } from 'zod';
import { careEventSchema, careEventPatchSchema } from '../care-events/schema.js';
import { growthSchema } from '../growth/schema.js';

// Mirrors the mutation shapes apps/mobile/lib/offline/database.ts already
// queues today (Phase 1) — the sync engine is what finally drains that queue.
const careEventCreateMutation = z.object({
  id: z.string(),
  type: z.literal('care-event'),
  payload: careEventSchema.and(z.object({ babyId: z.string() })),
});

const careEventUpdateMutation = z.object({
  id: z.string(),
  type: z.literal('care-event-update'),
  payload: careEventPatchSchema.and(
    z.object({
      id: z.string(),
      babyId: z.string(),
      expectedUpdatedAt: z.coerce.date().optional(),
    }),
  ),
});

const careEventDeleteMutation = z.object({
  id: z.string(),
  type: z.literal('care-event-delete'),
  payload: z.object({ id: z.string(), babyId: z.string() }),
});

const growthMeasurementMutation = z.object({
  id: z.string(),
  type: z.literal('growth-measurement'),
  payload: growthSchema.and(z.object({ babyId: z.string() })),
});

export const syncMutationSchema = z.discriminatedUnion('type', [
  careEventCreateMutation,
  careEventUpdateMutation,
  careEventDeleteMutation,
  growthMeasurementMutation,
]);

export const syncSchema = z.object({
  mutations: z.array(syncMutationSchema),
});

export type SyncMutation = z.infer<typeof syncMutationSchema>;
