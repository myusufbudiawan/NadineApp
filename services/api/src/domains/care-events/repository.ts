import { careEventTypes } from './schema.js';

export type CareEventType = (typeof careEventTypes)[number];

export type StoredCareEvent = {
  id: string;
  babyId: string;
  type: CareEventType;
  occurredAt: Date;
  data: Record<string, unknown>;
  notes?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export interface CareEventRepository {
  findByIdempotencyKey(
    babyId: string,
    idempotencyKey: string,
  ): Promise<StoredCareEvent | undefined>;
  findById(babyId: string, id: string): Promise<StoredCareEvent | undefined>;
  list(babyId: string, type?: CareEventType): Promise<StoredCareEvent[]>;
  create(event: StoredCareEvent): Promise<StoredCareEvent>;
  update(
    id: string,
    patch: Partial<Pick<StoredCareEvent, 'occurredAt' | 'data' | 'notes' | 'updatedAt'>>,
  ): Promise<StoredCareEvent>;
  softDelete(id: string): Promise<StoredCareEvent>;
}

export class InMemoryCareEventRepository implements CareEventRepository {
  private events = new Map<string, StoredCareEvent>();

  async findByIdempotencyKey(babyId: string, idempotencyKey: string) {
    return [...this.events.values()].find(
      (event) => event.babyId === babyId && event.idempotencyKey === idempotencyKey,
    );
  }

  async findById(babyId: string, id: string) {
    const event = this.events.get(id);
    return event && event.babyId === babyId ? event : undefined;
  }

  async list(babyId: string, type?: CareEventType) {
    return [...this.events.values()]
      .filter(
        (event) =>
          event.babyId === babyId && !event.deletedAt && (!type || event.type === type),
      )
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async create(event: StoredCareEvent) {
    this.events.set(event.id, event);
    return event;
  }

  async update(
    id: string,
    patch: Partial<Pick<StoredCareEvent, 'occurredAt' | 'data' | 'notes' | 'updatedAt'>>,
  ) {
    const existing = this.events.get(id);
    if (!existing) throw new Error('Care event not found');
    const updated = { ...existing, ...patch };
    this.events.set(id, updated);
    return updated;
  }

  async softDelete(id: string) {
    const existing = this.events.get(id);
    if (!existing) throw new Error('Care event not found');
    const updated = { ...existing, deletedAt: new Date() };
    this.events.set(id, updated);
    return updated;
  }
}
