import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { testTokenVerifier, testUser } from './helpers/auth.js';

function createMutation(babyId: string, overrides: Partial<Record<string, unknown>> = {}) {
  const eventId = randomUUID();
  return {
    id: randomUUID(),
    type: 'care-event' as const,
    payload: {
      id: eventId,
      babyId,
      type: 'feeding',
      occurredAt: new Date().toISOString(),
      data: { method: 'bottle', amount: 36, unit: 'ml' },
      idempotencyKey: eventId,
      ...overrides,
    },
  };
}

describe('sync', () => {
  let app: ReturnType<typeof buildServer>;
  let babyId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    const user = testUser();
    headers = user.authHeader;
    const babyResponse = await app.inject({
      method: 'POST',
      url: '/v1/babies',
      headers,
      payload: {
        name: 'Test Baby',
        sex: 'girl',
        dateOfBirth: new Date('2024-01-01').toISOString(),
        gestationalWeeks: 30,
        gestationalDays: 0,
        birthWeightKg: 1.5,
        fullTermReferenceWeeks: 40,
      },
    });
    babyId = babyResponse.json().id;
  });

  it('applies a batch of offline mutations and creates exactly one event per mutation', async () => {
    const mutation = createMutation(babyId);
    const response = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [mutation] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().results).toEqual([
      expect.objectContaining({ id: mutation.id, status: 'applied' }),
    ]);

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/events`, headers });
    expect(list.json()).toHaveLength(1);
  });

  it('resubmitting the same batch (offline retry after a dropped response) does not duplicate the event', async () => {
    const mutation = createMutation(babyId);
    await app.inject({ method: 'POST', url: '/v1/sync', headers, payload: { mutations: [mutation] } });
    const retry = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [mutation] },
    });
    expect(retry.json().results[0].status).toBe('duplicate');

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/events`, headers });
    expect(list.json()).toHaveLength(1);
  });

  it('surfaces a conflict instead of silently overwriting a concurrent edit from another device', async () => {
    const createResult = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [createMutation(babyId)] },
    });
    const created = createResult.json().results[0].event as {
      id: string;
      updatedAt: string;
    };

    // Device A edits first, moving the server's updatedAt forward.
    await app.inject({
      method: 'PATCH',
      url: `/v1/babies/${babyId}/events/${created.id}`,
      headers,
      payload: { notes: 'Device A note' },
    });

    // Device B queued its edit offline against the *original* updatedAt and
    // only now gets connectivity to sync it.
    const deviceBMutation = {
      id: randomUUID(),
      type: 'care-event-update' as const,
      payload: {
        id: created.id,
        babyId,
        notes: 'Device B note',
        expectedUpdatedAt: created.updatedAt,
      },
    };
    const response = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [deviceBMutation] },
    });
    expect(response.json().results[0].status).toBe('conflict');

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/events`, headers });
    // Device A's edit must survive untouched — no silent overwrite.
    expect(list.json()[0].notes).toBe('Device A note');
  });

  it('rejects an unrecognized mutation shape with a validation error', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [{ id: randomUUID(), type: 'not-a-real-type', payload: {} }] },
    });
    expect(response.statusCode).toBe(400);
  });

  it('a delete mutation tombstones the event and is safe to resubmit', async () => {
    const createResult = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [createMutation(babyId)] },
    });
    const created = createResult.json().results[0].event as { id: string };

    const deleteMutation = {
      id: randomUUID(),
      type: 'care-event-delete' as const,
      payload: { id: created.id, babyId },
    };
    const first = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [deleteMutation] },
    });
    expect(first.json().results[0].status).toBe('applied');

    const retry = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers,
      payload: { mutations: [deleteMutation] },
    });
    expect(retry.json().results[0].status).toBe('duplicate');

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/events`, headers });
    expect(list.json()).toHaveLength(0);
  });

  it('rejects a request with no access token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      payload: { mutations: [createMutation(babyId)] },
    });
    expect(response.statusCode).toBe(401);
  });

  it("rejects mutations against another user's baby", async () => {
    const otherUser = testUser();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/sync',
      headers: otherUser.authHeader,
      payload: { mutations: [createMutation(babyId)] },
    });
    expect(response.json().results[0].status).toBe('error');
  });
});
