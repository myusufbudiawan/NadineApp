export type SyncConflict = {
  id: string;
  mutationId: string;
  entityType: string;
  entityId: string;
  localPayload: {
    babyId?: string;
    notes?: string;
    occurredAt?: string;
    data?: Record<string, unknown>;
  };
  serverEvent: {
    id: string;
    occurredAt: string;
    data: Record<string, unknown>;
    notes?: string;
    updatedAt: string;
  };
  createdAt: string;
};
