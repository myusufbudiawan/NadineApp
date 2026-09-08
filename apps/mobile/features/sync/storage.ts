import * as Crypto from 'expo-crypto';
import {
  deleteConflict,
  listConflicts,
  overwriteCareEventFromServer,
  queueMutation,
  SyncConflictRow,
} from '@/lib/offline/database';
import { SyncConflict } from './types';

function fromRow(row: SyncConflictRow): SyncConflict {
  return {
    id: row.id,
    mutationId: row.mutation_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    localPayload: JSON.parse(row.local_payload),
    serverEvent: JSON.parse(row.server_payload),
    createdAt: row.created_at,
  };
}

export async function loadConflicts(): Promise<SyncConflict[]> {
  const rows = await listConflicts();
  return rows.map(fromRow);
}

// "Keep mine" — Section 11 5.1's explicit conflict resolution UX, the
// opposite of a silent overwrite: the caregiver's local edit is re-queued
// against the server's *current* version, so the next sync applies cleanly
// instead of conflicting again.
export async function resolveKeepLocal(conflict: SyncConflict) {
  await queueMutation(
    Crypto.randomUUID(),
    'care-event-update',
    JSON.stringify({
      ...conflict.localPayload,
      id: conflict.entityId,
      expectedUpdatedAt: conflict.serverEvent.updatedAt,
    }),
  );
  await deleteConflict(conflict.id);
}

export async function resolveAcceptServer(conflict: SyncConflict) {
  await overwriteCareEventFromServer({
    id: conflict.entityId,
    occurredAt: conflict.serverEvent.occurredAt,
    data: conflict.serverEvent.data,
    notes: conflict.serverEvent.notes,
    updatedAt: conflict.serverEvent.updatedAt,
  });
  await deleteConflict(conflict.id);
}
