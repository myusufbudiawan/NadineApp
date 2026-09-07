import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

describe('privacy controls', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  it('exports account data across babies, events, growth, reminders, and shares', async () => {
    const baby = await app.inject({
      method: 'POST',
      url: '/v1/babies',
      payload: {
        name: 'Aisyah',
        sex: 'girl',
        dateOfBirth: new Date(Date.now() - 20 * 86_400_000).toISOString(),
        gestationalWeeks: 32,
        gestationalDays: 3,
        birthWeightKg: 1.58,
        fullTermReferenceWeeks: 40,
      },
    });
    const babyId = baby.json().id;

    const exported = await app.inject({ method: 'GET', url: '/v1/account/export' });
    expect(exported.statusCode).toBe(200);
    const body = exported.json();
    expect(body.babies).toHaveLength(1);
    expect(body.babies[0].baby.id).toBe(babyId);
    expect(body.babies[0]).toHaveProperty('careEvents');
    expect(body.babies[0]).toHaveProperty('growthMeasurements');
    expect(body.babies[0]).toHaveProperty('reminders');
    expect(body.babies[0]).toHaveProperty('shareGrants');
  });

  it('creates, lists, and cancels a deletion request', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/account/deletion-requests',
      payload: { reason: 'No longer needed' },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json().status).toBe('pending');

    const list = await app.inject({ method: 'GET', url: '/v1/account/deletion-requests' });
    expect(list.json()).toHaveLength(1);

    const cancel = await app.inject({
      method: 'POST',
      url: `/v1/account/deletion-requests/${create.json().id}/cancel`,
    });
    expect(cancel.json().status).toBe('cancelled');
  });

  it('revokes all sessions for an email at once', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/auth/session',
      payload: { email: 'mama@example.com', password: 'supersecret' },
    });
    await app.inject({
      method: 'POST',
      url: '/v1/auth/session',
      payload: { email: 'mama@example.com', password: 'supersecret' },
    });

    const revoke = await app.inject({
      method: 'POST',
      url: '/v1/auth/sessions/revoke-all',
      payload: { email: 'mama@example.com' },
    });
    expect(revoke.json().revokedCount).toBe(2);
  });
});
