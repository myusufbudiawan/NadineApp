import { Pool } from 'pg';
import { CareEventRepository, CareEventType, StoredCareEvent } from './repository.js';

export class PostgresCareEventRepository implements CareEventRepository {
  constructor(private db: Pool) {}

  async findByIdempotencyKey(babyId: string, idempotencyKey: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM care_events WHERE baby_id = $1 AND idempotency_key = $2`,
      [babyId, idempotencyKey],
    );
    return rows[0] ? toStoredCareEvent(rows[0]) : undefined;
  }

  async findById(babyId: string, id: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM care_events WHERE baby_id = $1 AND id = $2`,
      [babyId, id],
    );
    return rows[0] ? toStoredCareEvent(rows[0]) : undefined;
  }

  async list(babyId: string, type?: CareEventType) {
    const { rows } = await this.db.query(
      `SELECT * FROM care_events
       WHERE baby_id = $1 AND deleted_at IS NULL AND ($2::text IS NULL OR type = $2)
       ORDER BY occurred_at DESC`,
      [babyId, type ?? null],
    );
    return rows.map(toStoredCareEvent);
  }

  async create(event: StoredCareEvent) {
    await this.db.query(
      `INSERT INTO care_events (id, baby_id, type, occurred_at, data, notes, idempotency_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        event.id,
        event.babyId,
        event.type,
        event.occurredAt,
        JSON.stringify(event.data),
        event.notes ?? null,
        event.idempotencyKey,
        event.createdAt,
        event.updatedAt,
      ],
    );
    return event;
  }

  async update(
    id: string,
    patch: Partial<Pick<StoredCareEvent, 'occurredAt' | 'data' | 'notes' | 'updatedAt'>>,
  ) {
    const { rows } = await this.db.query(`SELECT * FROM care_events WHERE id = $1`, [id]);
    if (!rows[0]) throw new Error('Care event not found');
    const existing = toStoredCareEvent(rows[0]);
    const updated = { ...existing, ...patch };
    await this.db.query(
      `UPDATE care_events SET occurred_at = $2, data = $3, notes = $4, updated_at = $5 WHERE id = $1`,
      [id, updated.occurredAt, JSON.stringify(updated.data), updated.notes ?? null, updated.updatedAt],
    );
    return updated;
  }

  async softDelete(id: string) {
    const { rows } = await this.db.query(
      `UPDATE care_events SET deleted_at = now() WHERE id = $1 RETURNING *`,
      [id],
    );
    if (!rows[0]) throw new Error('Care event not found');
    return toStoredCareEvent(rows[0]);
  }
}

function toStoredCareEvent(row: Record<string, unknown>): StoredCareEvent {
  return {
    id: row.id as string,
    babyId: row.baby_id as string,
    type: row.type as CareEventType,
    occurredAt: row.occurred_at as Date,
    data: row.data as Record<string, unknown>,
    notes: (row.notes as string | null) ?? undefined,
    idempotencyKey: row.idempotency_key as string,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
    deletedAt: (row.deleted_at as Date | null) ?? undefined,
  };
}
