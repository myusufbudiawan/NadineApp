import { secureStoreAdapter } from '@/lib/auth/session';
import { getServerBabyId } from '@/lib/offline/serverBaby';
import { MilestoneId, MilestoneRecord } from './types';

export type MilestoneRecords = Partial<Record<MilestoneId, MilestoneRecord>>;

// Device-local for now (like dashboard preferences) — not yet synced to the
// server, so a second caregiver's phone keeps its own list. Keyed by the
// server baby id so switching babies (select-baby) never mixes two babies'
// journeys; falls back to a local key before the first sync assigns one.
async function keyFor() {
  const serverBabyId = await getServerBabyId();
  return `preemietrack.milestones.${serverBabyId ?? 'local'}`;
}

type Listener = () => void;
const listeners = new Set<Listener>();

// Lets the milestones screen and home card refresh when a milestone is
// marked elsewhere (e.g. auto-detected while they're mounted).
export function subscribeToMilestones(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadMilestones(): Promise<MilestoneRecords> {
  const raw = await secureStoreAdapter.getItem(await keyFor());
  if (!raw) return {};
  try {
    return JSON.parse(raw) as MilestoneRecords;
  } catch {
    return {};
  }
}

async function save(records: MilestoneRecords) {
  await secureStoreAdapter.setItem(await keyFor(), JSON.stringify(records));
  listeners.forEach((l) => l());
}

export async function markMilestone(id: MilestoneId, achievedAt: Date, celebrated: boolean) {
  const records = await loadMilestones();
  records[id] = { achievedAt: achievedAt.toISOString(), celebrated };
  await save(records);
}

export async function markCelebrated(id: MilestoneId) {
  const records = await loadMilestones();
  const record = records[id];
  if (!record || record.celebrated) return;
  records[id] = { ...record, celebrated: true };
  await save(records);
}

export async function unmarkMilestone(id: MilestoneId) {
  const records = await loadMilestones();
  delete records[id];
  await save(records);
}
