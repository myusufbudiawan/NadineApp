import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { listServerCareEvents } from '@/lib/api/careEvents';
import { listServerGrowth } from '@/lib/api/growth';
import { listServerMilestones } from '@/lib/api/milestones';
import { requestCelebration } from '@/features/milestones/celebrate';
import { CELEBRATE_WITHIN_DAYS } from '@/features/milestones/detect';
import { insertCareEventIfMissing, insertGrowthMeasurementIfMissing, upsertMilestoneIfNewer } from './database';

const DAY_MS = 86_400_000;

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
  const [events, growth, milestones] = await Promise.all([
    listServerCareEvents(serverBabyId),
    listServerGrowth(serverBabyId),
    listServerMilestones(serverBabyId),
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

  for (const milestone of milestones) {
    // A second caregiver's device may have marked (or un-celebrated) this
    // same milestone since this device last synced — only takes it if it's
    // actually newer, so a pending local write already queued to go out
    // isn't clobbered by pulling in what this device itself just pushed.
    const { wasNew } = await upsertMilestoneIfNewer({
      milestoneId: milestone.milestoneId,
      babyId: LOCAL_BABY_ID,
      achievedAt: milestone.achievedAt,
      celebrated: milestone.celebrated,
      updatedAt: milestone.updatedAt,
    });
    // Another caregiver's device marked this first — celebrate it here too,
    // so it isn't a one-device-only moment. Only for a genuinely new,
    // recent, not-yet-celebrated milestone: skips old history syncing in
    // for the first time, and never re-celebrates one this device already
    // played (celebrated flips true locally the moment it does).
    const recent = Date.now() - new Date(milestone.achievedAt).getTime() <= CELEBRATE_WITHIN_DAYS * DAY_MS;
    if (wasNew && !milestone.celebrated && recent) {
      requestCelebration(milestone.milestoneId);
    }
  }
}
