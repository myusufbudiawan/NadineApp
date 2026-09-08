import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../common/auth/errors.js';
import { AuditService } from '../audit/service.js';
import {
  CareEventRepository,
  CareEventType,
  StoredCareEvent,
} from './repository.js';

export type CreateCareEventInput = {
  type: CareEventType;
  occurredAt: Date;
  data: Record<string, unknown>;
  notes?: string;
  idempotencyKey: string;
};

export type PatchCareEventInput = Partial<
  Pick<StoredCareEvent, 'occurredAt' | 'data' | 'notes'>
> & {
  // Optimistic-concurrency check for the sync engine (5.1): the client's
  // last-known updatedAt. If it no longer matches the server's copy, someone
  // else changed the record first — surface a conflict instead of silently
  // overwriting their edit.
  expectedUpdatedAt?: Date;
};

export class ConflictError extends Error {
  constructor(public readonly current: StoredCareEvent) {
    super('Care event was modified by another device');
  }
}

/* Event lifecycle; never exposes clinical advice. */
export class CareEventsService {
  constructor(
    private repository: CareEventRepository,
    private audit: AuditService,
  ) {}

  list(babyId: string, type?: CareEventType) {
    return this.repository.list(babyId, type);
  }

  async create(actorId: string, babyId: string, input: CreateCareEventInput) {
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

  async update(actorId: string, babyId: string, id: string, patch: PatchCareEventInput) {
    const existing = await this.repository.findById(babyId, id);
    if (!existing) throw new NotFoundError('Care event not found');
    if (
      patch.expectedUpdatedAt &&
      patch.expectedUpdatedAt.getTime() !== existing.updatedAt.getTime()
    ) {
      throw new ConflictError(existing);
    }
    const { expectedUpdatedAt: _expectedUpdatedAt, ...fields } = patch;
    const event = await this.repository.update(id, {
      ...fields,
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

  async remove(actorId: string, babyId: string, id: string) {
    const existing = await this.repository.findById(babyId, id);
    if (!existing) throw new NotFoundError('Care event not found');
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
