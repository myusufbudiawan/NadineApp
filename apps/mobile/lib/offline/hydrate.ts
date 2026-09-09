import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { listServerCareEvents } from '@/lib/api/careEvents';
import { listServerGrowth } from '@/lib/api/growth';
import { insertCareEventIfMissing, insertGrowthMeasurementIfMissing } from './database';

// Pulls this baby's full server-side history down into local SQLite — the
// counterpart to the mutation queue, which only ever pushes local writes
// out. Without this, a second device only ever sees events/measurements
// logged *after* it signed in, never the history from before.
//
// ponytail: fetches and re-checks the entire history every call (no `since`
// cursor) — fine at MVP data volumes; switch to incremental (there's already
// a listCareEventsSince for the local side) if a baby's history grows large
// enough that this becomes slow on every login.
export async function hydrateFromServer(serverBabyId: string): Promise<void> {
  const [events, growth] = await Promise.all([
    listServerCareEvents(serverBabyId),
    listServerGrowth(serverBabyId),
  ]);

  for (const event of events) {
    // Care-event creation now always echoes the client's original id back
    // (services/api care-events/service.ts), so event.id IS the
    // originating device's local id — using it here is what makes this
    // idempotent across repeated hydrations.
    await insertCareEventIfMissing({
      id: event.id,
      babyId: LOCAL_BABY_ID,
      type: event.type,
      occurredAt: event.occurredAt,
      data: event.data,
      notes: event.notes,
      serverUpdatedAt: event.updatedAt,
    });
  }

  for (const measurement of growth) {
    // Growth measurements don't get the same id passthrough — reconcile on
    // idempotencyKey instead. Skip the (should be rare) pre-existing rows
    // that predate that field; nothing local to match them against anyway.
    if (!measurement.idempotencyKey) continue;
    await insertGrowthMeasurementIfMissing({
      id: measurement.idempotencyKey,
      babyId: LOCAL_BABY_ID,
      metric: measurement.metric,
      value: measurement.value,
      unit: measurement.unit,
      measuredAt: measurement.measuredAt,
    });
  }
}
