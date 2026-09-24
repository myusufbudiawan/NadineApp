import { BabyProfile } from '@/features/baby-profile/types';
import { loadCareEventHistory } from '@/features/care-events/storage';
import { FeedingData, WeightData } from '@/features/care-events/types';
import { loadMeasurementsForMetric } from '@/features/growth/storage';
import { requestCelebration } from './celebrate';
import { loadMilestones, markMilestone } from './storage';
import { MilestoneId, milestonesFor } from './types';

const LB_PER_KG = 2.20462;
const ML_PER_OZ = 29.5735;
const DAY_MS = 86_400_000;
const REGAIN_EARLIEST_DAYS = 3;
export const CELEBRATE_WITHIN_DAYS = 7;
// Typical full-term intake once feeding is established: ~150 ml/kg/day
// (NEEDS-CLINICAL-REVIEW: many units target 150–180 for preterm babies).
export const TERM_FEEDING_ML_PER_KG_PER_DAY = 150;

type Reading = { kg: number; at: Date };

async function weightReadings(babyId: string): Promise<Reading[]> {
  const [events, measurements] = await Promise.all([
    loadCareEventHistory(babyId, 'weight'),
    loadMeasurementsForMetric(babyId, 'weight'),
  ]);
  const toKg = (value: number, unit: string) => (unit === 'lb' ? value / LB_PER_KG : value);
  return [
    ...events.map((e) => {
      const d = e.data as WeightData;
      return { kg: toKg(d.value, d.unit), at: new Date(e.occurredAt) };
    }),
    ...measurements.map((m) => ({ kg: toKg(m.value, m.unit), at: new Date(m.measuredAt) })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
}

// Finds data-driven milestones that have happened but aren't recorded yet,
// records them (dated to when they actually happened, where the data says),
// and queues a celebration for each recent one. Returns the ones it found.
async function runDetection(
  babyId: string,
  profile: BabyProfile,
): Promise<MilestoneId[]> {
  const records = await loadMilestones();
  const applicable = new Set(milestonesFor(profile).map((m) => m.id));
  const pending = (id: MilestoneId) => applicable.has(id) && !records[id];
  const found: { id: MilestoneId; at: Date }[] = [];

  if (pending('regained-birth-weight') || pending('two-kilos') || pending('term-feeding-volume')) {
    const weights = await weightReadings(babyId);
    // Babies lose weight in their first days, so a reading in that window
    // at/above birth weight is just the start, not a regain.
    if (pending('regained-birth-weight')) {
      const earliest = new Date(profile.dateOfBirth).getTime() + REGAIN_EARLIEST_DAYS * DAY_MS;
      const back = weights.find((w) => w.at.getTime() >= earliest && w.kg >= profile.birthWeightKg);
      if (back) found.push({ id: 'regained-birth-weight', at: back.at });
    }
    if (pending('two-kilos')) {
      const reached = weights.find((w) => w.kg >= 2);
      if (reached) found.push({ id: 'two-kilos', at: reached.at });
    }
    const latest = weights[weights.length - 1];
    if (pending('term-feeding-volume') && latest) {
      const feeds = await loadCareEventHistory(babyId, 'feeding');
      const since = Date.now() - DAY_MS;
      const mlLast24h = feeds
        .filter((f) => new Date(f.occurredAt).getTime() >= since)
        .reduce((sum, f) => {
          const d = f.data as FeedingData;
          return sum + (d.unit === 'oz' ? d.amount * ML_PER_OZ : d.amount);
        }, 0);
      if (mlLast24h >= TERM_FEEDING_ML_PER_KG_PER_DAY * latest.kg) {
        found.push({ id: 'term-feeding-volume', at: new Date() });
      }
    }
  }

  if (pending('first-cuddle')) {
    const sessions = await loadCareEventHistory(babyId, 'kangaroo');
    const first = sessions[sessions.length - 1]; // history is newest-first
    if (first) found.push({ id: 'first-cuddle', at: new Date(first.occurredAt) });
  }

  if (pending('reached-due-date')) {
    const daysEarly =
      profile.fullTermReferenceWeeks * 7 - (profile.gestationalWeeks * 7 + profile.gestationalDays);
    const due = new Date(new Date(profile.dateOfBirth).getTime() + daysEarly * DAY_MS);
    if (Date.now() >= due.getTime()) found.push({ id: 'reached-due-date', at: due });
  }

  for (const { id, at } of found) {
    // Something that happened a while ago (e.g. data logged before this
    // feature existed) still joins the journey, just quietly — no parade of
    // back-to-back celebrations for old news the first time the app looks.
    const recent = Date.now() - at.getTime() <= CELEBRATE_WITHIN_DAYS * DAY_MS;
    await markMilestone(id, at, !recent);
    if (recent) requestCelebration(id);
  }
  return found.map((f) => f.id);
}

let inFlight: Promise<MilestoneId[]> | undefined;

// Home runs this on every focus; overlapping runs would both see the same
// milestone as unrecorded, so they share one pass.
export function detectMilestones(babyId: string, profile: BabyProfile): Promise<MilestoneId[]> {
  inFlight ??= runDetection(babyId, profile).finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}
