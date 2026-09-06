import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

const babyId = randomUUID();

function feedingPayload(idempotencyKey = randomUUID()) {
  return {
    type: 'feeding',
    occurredAt: new Date().toISOString(),
    data: { method: 'bottle', amount: 36, unit: 'ml' },
    notes: 'Tolerated well',
    idempotencyKey,
  };
}

describe('care events', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  it('creates and lists an event', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      payload: feedingPayload(),
    });
    expect(create.statusCode).toBe(201);
    const created = create.json();
    expect(created.data).toEqual({ method: 'bottle', amount: 36, unit: 'ml' });

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/events`,
    });
    expect(list.json()).toHaveLength(1);
  });

  it('does not duplicate on repeated idempotency key', async () => {
    const key = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      payload: feedingPayload(key),
    });
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      payload: feedingPayload(key),
    });
    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/events`,
    });
    expect(list.json()).toHaveLength(1);
  });

  it('rejects an invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      payload: {
        type: 'feeding',
        occurredAt: new Date().toISOString(),
        data: { method: 'bottle', amount: -5, unit: 'ml' },
        idempotencyKey: randomUUID(),
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it('updates and deletes an event, recording an audit trail', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      payload: feedingPayload(),
    });
    const eventId = create.json().id;

    const update = await app.inject({
      method: 'PATCH',
      url: `/v1/babies/${babyId}/events/${eventId}`,
      payload: { notes: 'Updated note' },
    });
    expect(update.json().notes).toBe('Updated note');

    const remove = await app.inject({
      method: 'DELETE',
      url: `/v1/babies/${babyId}/events/${eventId}`,
    });
    expect(remove.statusCode).toBe(204);

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/events`,
    });
    expect(list.json()).toHaveLength(0);

    const audit = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/audit`,
    });
    const actions = audit.json().map((entry: { action: string }) => entry.action);
    expect(actions).toEqual(
      expect.arrayContaining(['create', 'update', 'delete']),
    );
  });

  it('never carries dosing-guidance fields on medication events', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      payload: {
        type: 'medication',
        occurredAt: new Date().toISOString(),
        data: { medicationName: 'Vitamin D', dose: 400, unit: 'IU' },
        idempotencyKey: randomUUID(),
      },
    });
    expect(response.statusCode).toBe(201);
    const keys = Object.keys(response.json().data);
    expect(keys).toEqual(
      expect.arrayContaining(['medicationName', 'dose', 'unit']),
    );
    expect(keys.some((key) => /recommend|suggested|max-?dose/i.test(key))).toBe(
      false,
    );
  });
});
