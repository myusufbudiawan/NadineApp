import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/service.js';
import {
  CareEventRepository,
  CareEventType,
  StoredCareEvent,
} from './repository.js';

const actorId = 'development-user';

export type CreateCareEventInput = {
  type: CareEventType;
  occurredAt: Date;
  data: Record<string, unknown>;
  notes?: string;
  idempotencyKey: string;
};

export type PatchCareEventInput = Partial<
  Pick<StoredCareEvent, 'occurredAt' | 'data' | 'notes'>
>;

/* Event lifecycle; never exposes clinical advice. */
export class CareEventsService {
  constructor(
    private repository: CareEventRepository,
    private audit: AuditService,
  ) {}

  list(babyId: string, type?: CareEventType) {
    return this.repository.list(babyId, type);
  }

  async create(babyId: string, input: CreateCareEventInput) {
    const existing = await this.repository.findByIdempotencyKey(
      babyId,
      input.idempotencyKey,
    );
    if (existing) return existing;

    const now = new Date();
    const event = await this.repository.create({
      id: randomUUID(),
      babyId,
      type: input.type,
      occurredAt: input.occurredAt,
      data: input.data,
      notes: input.notes,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'create',
      entityType: 'care_event',
      entityId: event.id,
    });
    return event;
  }

  async update(babyId: string, id: string, patch: PatchCareEventInput) {
    const existing = await this.repository.findById(babyId, id);
    if (!existing) throw new Error('Care event not found');
    const event = await this.repository.update(id, {
      ...patch,
      updatedAt: new Date(),
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'update',
      entityType: 'care_event',
      entityId: id,
    });
    return event;
  }

  async remove(babyId: string, id: string) {
    const existing = await this.repository.findById(babyId, id);
    if (!existing) throw new Error('Care event not found');
    const event = await this.repository.softDelete(id);
    await this.audit.record({
      actorId,
      babyId,
      action: 'delete',
      entityType: 'care_event',
      entityId: id,
    });
    return event;
  }
}
