import * as Crypto from 'expo-crypto';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { createBaby, updateBaby } from '@/lib/api/babies';
import { submitMutations, SyncMutationResult } from '@/lib/api/sync';
import {
  listPendingMutations,
  markMutationFailed,
  markMutationSynced,
  recordConflict,
  setServerUpdatedAt,
  MutationQueueRow,
} from './database';
import { getServerBabyId, setLocalDataOwner, setServerBabyId } from './serverBaby';
import { supabase } from '@/lib/supabase/client';

// FR-017 / Section 11 5.1 — the sync engine that finally drains the
// mutation_queue every screen under features/care-events has been writing
// to since Phase 1. Local writes always happen first (features/care-events
// /storage.ts); this only ever reconciles them with the server afterwards,
// so the UI never blocks on network.

const MAX_BATCH = 25;
const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

function backoffFor(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** attempts, MAX_BACKOFF_MS);
}

// Guards against two overlapping runSync() calls (e.g. app-foreground and a
// polling interval firing close together) racing on the same queue rows.
let inFlight: Promise<SyncSummary> | null = null;

export type SyncSummary = {
  applied: number;
  conflicts: number;
  failed: number;
};

export async function runSync(): Promise<SyncSummary> {
  if (inFlight) return inFlight;
  inFlight = runSyncOnce().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSyncOnce(): Promise<SyncSummary> {
  const summary: SyncSummary = { applied: 0, conflicts: 0, failed: 0 };
  const pending = await listPendingMutations();
  if (pending.length === 0) return summary;

  for (let offset = 0; offset < pending.length; offset += MAX_BATCH) {
    const batch = pending.slice(offset, offset + MAX_BATCH);
    await syncBatch(batch, summary);
  }
  return summary;
}

async function syncBatch(rows: MutationQueueRow[], summary: SyncSummary) {
  // baby-profile rows don't go through /v1/sync (that endpoint only knows
  // care-event-shaped mutations) — they hit the same POST/PATCH /v1/babies
  // endpoints baby-setup.tsx calls directly on the happy path.
  const babyProfileRows = rows.filter((row) => row.entity_type === 'baby-profile');
  const batch = rows.filter((row) => row.entity_type !== 'baby-profile');
  for (const row of babyProfileRows) {
    await syncBabyProfileRow(row, summary);
  }
  if (batch.length === 0) return;

  // Local rows always carry the fixed LOCAL_BABY_ID placeholder (every
  // screen expects that) — the server only knows its own real baby UUID, so
  // translate on the way out. Local state is never touched.
  const serverBabyId = await getServerBabyId();
  let results: SyncMutationResult[];
  try {
    const response = await submitMutations(
      batch.map((row) => {
        const payload = JSON.parse(row.payload);
        if (serverBabyId && payload.babyId === LOCAL_BABY_ID) {
          payload.babyId = serverBabyId;
        }
        return { id: row.id, type: row.entity_type, payload };
      }),
    );
    results = response.results;
  } catch (error) {
    // Server unreachable / offline — every mutation in this batch stays
    // queued and backs off, per-row, rather than the whole app erroring.
    for (const row of batch) {
      await failRow(row, error instanceof Error ? error.message : 'Network error');
      summary.failed += 1;
    }
    return;
  }

  const byId = new Map(results.map((result) => [result.id, result]));
  for (const row of batch) {
    const result = byId.get(row.id);
    if (!result) {
      await failRow(row, 'No result returned for this mutation');
      summary.failed += 1;
      continue;
    }
    await applyResult(row, result);
    if (result.status === 'applied' || result.status === 'duplicate') summary.applied += 1;
    else if (result.status === 'conflict') summary.conflicts += 1;
    else summary.failed += 1;
  }
}

async function syncBabyProfileRow(row: MutationQueueRow, summary: SyncSummary) {
  try {
    const payload = JSON.parse(row.payload);
    const existingServerId = await getServerBabyId();
    if (existingServerId) {
      await updateBaby(existingServerId, payload);
    } else {
      const created = await createBaby(payload);
      await setServerBabyId(created.id);
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) await setLocalDataOwner(data.session.user.id);
    await markMutationSynced(row.id);
    summary.applied += 1;
  } catch (error) {
    await failRow(row, error instanceof Error ? error.message : 'Network error');
    summary.failed += 1;
  }
}

async function failRow(row: MutationQueueRow, error: string) {
  const attempts = row.attempts + 1;
  const nextAttemptAt = new Date(Date.now() + backoffFor(attempts)).toISOString();
  console.warn(
    `sync: ${row.entity_type} mutation ${row.id} failed (attempt ${attempts}), retrying at ${nextAttemptAt}: ${error}`,
  );
  await markMutationFailed(row.id, attempts, nextAttemptAt, error);
}

const CARE_EVENT_TYPES = new Set(['care-event', 'care-event-update']);

async function applyResult(row: MutationQueueRow, result: SyncMutationResult) {
  if (result.status === 'applied' || result.status === 'duplicate') {
    // Only care-event rows have a server_updated_at column to reconcile;
    // growth-measurement rows have no equivalent conflict-check field.
    if (result.event && CARE_EVENT_TYPES.has(row.entity_type)) {
      await setServerUpdatedAt(result.event.id, result.event.updatedAt);
    }
    await markMutationSynced(row.id);
    return;
  }
  if (result.status === 'conflict') {
    const payload = JSON.parse(row.payload) as { id: string };
    await recordConflict({
      id: Crypto.randomUUID(),
      mutationId: row.id,
      entityType: row.entity_type,
      entityId: payload.id,
      localPayload: payload,
      serverPayload: result.serverEvent,
    });
    return;
  }
  await failRow(row, result.error ?? 'Sync rejected this mutation');
}
