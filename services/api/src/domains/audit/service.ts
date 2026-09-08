import { randomUUID } from 'node:crypto';
import { db } from '../../common/db/client.js';
import { AuditRepository, StoredAuditEvent } from './repository.js';
import { PostgresAuditRepository } from './postgres-repository.js';

export class InMemoryAuditRepository implements AuditRepository {
  private events: StoredAuditEvent[] = [];

  async record(event: StoredAuditEvent) {
    this.events.push(event);
    return event;
  }

  async list(babyId: string) {
    return this.events.filter((event) => event.babyId === babyId);
  }
}

export class AuditService {
  constructor(private repository: AuditRepository) {}

  // Sensitive record create/update/delete calls this — actor, action, entity,
  // timestamp only. Never pass the raw event payload here (FR-019).
  async record(input: Omit<StoredAuditEvent, 'id' | 'occurredAt'>) {
    return this.repository.record({
      ...input,
      id: randomUUID(),
      occurredAt: new Date(),
    });
  }

  async list(babyId: string) {
    return this.repository.list(babyId);
  }
}

// Shared across domains within one running server so an audit trail recorded
// by care-events is visible via the audit domain's own read route.
export const auditService = new AuditService(new PostgresAuditRepository(db));
