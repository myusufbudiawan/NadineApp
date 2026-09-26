import * as Crypto from 'expo-crypto';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import {
  deleteMilestone as deleteMilestoneRow,
  listMilestones,
  MilestoneRow,
  queueMutation,
  upsertMilestone as upsertMilestoneRow,
} from '@/lib/offline/database';
import { MilestoneId, MilestoneRecord } from './types';

export type MilestoneRecords = Partial<Record<MilestoneId, MilestoneRecord>>;

// Mutation payload shape queued under entity_type 'milestone' /
// 'milestone-delete' — handled directly in lib/offline/sync.ts (PUT/DELETE
// to /v1/babies/:babyId/milestones/:milestoneId), the same way baby-profile
// writes bypass the generic /v1/sync batch endpoint. Milestones are rare,
// single-field-ish writes where last-write-wins is exactly the right
// semantics, so there's no need for the conflict machinery care-events use.
export type MilestoneMutationPayload = {
  milestoneId: MilestoneId;
  achievedAt: string;
  celebrated: boolean;
};
export type MilestoneDeleteMutationPayload = { milestoneId: MilestoneId };

function fromRow(row: MilestoneRow): MilestoneRecord {
  return { achievedAt: row.achieved_at, celebrated: Boolean(row.celebrated) };
}

type Listener = () => void;
const listeners = new Set<Listener>();

// Lets the milestones screen and home card refresh when a milestone is
// marked elsewhere (e.g. auto-detected while they're mounted, or pulled in
// from another caregiver's device on the next sync).
export function subscribeToMilestones(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export async function loadMilestones(): Promise<MilestoneRecords> {
  const rows = await listMilestones(LOCAL_BABY_ID);
  const records: MilestoneRecords = {};
  for (const row of rows) records[row.milestone_id as MilestoneId] = fromRow(row);
  return records;
}

export async function markMilestone(id: MilestoneId, achievedAt: Date, celebrated: boolean) {
  const achievedAtIso = achievedAt.toISOString();
  const updatedAt = new Date().toISOString();
  await upsertMilestoneRow({
    milestoneId: id,
    babyId: LOCAL_BABY_ID,
    achievedAt: achievedAtIso,
    celebrated,
    updatedAt,
  });
  const payload: MilestoneMutationPayload = { milestoneId: id, achievedAt: achievedAtIso, celebrated };
  await queueMutation(Crypto.randomUUID(), 'milestone', JSON.stringify(payload));
  notify();
}

export async function markCelebrated(id: MilestoneId) {
  const records = await loadMilestones();
  const record = records[id];
  if (!record || record.celebrated) return;
  await markMilestone(id, new Date(record.achievedAt), true);
}

export async function unmarkMilestone(id: MilestoneId) {
  await deleteMilestoneRow(id);
  const payload: MilestoneDeleteMutationPayload = { milestoneId: id };
  await queueMutation(Crypto.randomUUID(), 'milestone-delete', JSON.stringify(payload));
  notify();
}
