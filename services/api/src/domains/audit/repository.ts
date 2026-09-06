export type StoredAuditEvent = {
  id: string;
  actorId: string;
  babyId: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  occurredAt: Date;
};

export interface AuditRepository {
  record(event: StoredAuditEvent): Promise<StoredAuditEvent>;
  list(babyId: string): Promise<StoredAuditEvent[]>;
}
