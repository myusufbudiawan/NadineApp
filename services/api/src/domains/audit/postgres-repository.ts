import { Pool } from 'pg';
import { AuditRepository, StoredAuditEvent } from './repository.js';

export class PostgresAuditRepository implements AuditRepository {
  constructor(private db: Pool) {}

  async record(event: StoredAuditEvent) {
    await this.db.query(
      `INSERT INTO audit_events (id, actor_id, baby_id, entity_type, entity_id, action, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event.id,
        event.actorId,
        event.babyId,
        event.entityType,
        event.entityId,
        event.action,
        event.occurredAt,
      ],
    );
    return event;
  }

  async list(babyId: string) {
    const { rows } = await this.db.query(
      `SELECT id, actor_id, baby_id, entity_type, entity_id, action, occurred_at
       FROM audit_events WHERE baby_id = $1 ORDER BY occurred_at DESC`,
      [babyId],
    );
    return rows.map(toStoredAuditEvent);
  }
}

function toStoredAuditEvent(row: Record<string, unknown>): StoredAuditEvent {
  return {
    id: row.id as string,
    actorId: row.actor_id as string,
    babyId: row.baby_id as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    action: row.action as StoredAuditEvent['action'],
    occurredAt: row.occurred_at as Date,
  };
}
