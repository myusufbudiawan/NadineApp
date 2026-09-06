import * as Crypto from 'expo-crypto';
import {
  CareEventRow,
  getLatestCareEventsByType,
  insertCareEvent,
  listCareEvents,
  queueMutation,
  softDeleteCareEvent,
  updateCareEvent,
} from '@/lib/offline/database';
import { CareEvent, CareEventData, CareEventType } from './types';
import { validateCareEventData } from './validation';

export type SaveCareEventInput<T extends CareEventType = CareEventType> = {
  babyId: string;
  type: T;
  occurredAt: Date;
  data: CareEventData;
  notes?: string;
};

function fromRow(row: CareEventRow): CareEvent {
  return {
    id: row.id,
    babyId: row.baby_id,
    type: row.type as CareEventType,
    occurredAt: row.occurred_at,
    data: JSON.parse(row.data),
    notes: row.notes ?? undefined,
  };
}

// Local-first save: the event lands in local SQLite immediately (so the UI can
// show it before any network round trip) and a sync mutation is queued for the
// Phase 5 sync engine to reconcile with the server, keyed by the event id so
// retries stay idempotent.
export async function saveCareEvent(input: SaveCareEventInput): Promise<string> {
  const error = validateCareEventData(input.type, input.data);
  if (error) throw new Error(error);

  const id = Crypto.randomUUID();
  const occurredAt = input.occurredAt.toISOString();

  await insertCareEvent({
    id,
    babyId: input.babyId,
    type: input.type,
    occurredAt,
    data: input.data,
    notes: input.notes,
  });

  await queueMutation(
    Crypto.randomUUID(),
    'care-event',
    JSON.stringify({
      id,
      babyId: input.babyId,
      type: input.type,
      occurredAt,
      data: input.data,
      notes: input.notes,
      idempotencyKey: id,
    }),
  );

  return id;
}

export async function loadLatestCareEvents(babyId: string): Promise<CareEvent[]> {
  const rows = await getLatestCareEventsByType(babyId);
  return rows.map(fromRow);
}

export async function loadCareEventHistory(
  babyId: string,
  type: CareEventType,
): Promise<CareEvent[]> {
  const rows = await listCareEvents(babyId, type);
  return rows.map(fromRow);
}

export async function editCareEvent(
  id: string,
  patch: { occurredAt?: Date; data?: CareEventData; notes?: string },
) {
  await updateCareEvent(id, {
    occurredAt: patch.occurredAt?.toISOString(),
    data: patch.data,
    notes: patch.notes,
  });
  await queueMutation(
    Crypto.randomUUID(),
    'care-event-update',
    JSON.stringify({ id, ...patch, occurredAt: patch.occurredAt?.toISOString() }),
  );
}

export async function deleteCareEvent(id: string) {
  await softDeleteCareEvent(id);
  await queueMutation(
    Crypto.randomUUID(),
    'care-event-delete',
    JSON.stringify({ id }),
  );
}
