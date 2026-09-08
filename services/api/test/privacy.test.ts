import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { createTestBaby, testTokenVerifier, testUser } from './helpers/auth.js';

describe('privacy controls', () => {
  let app: ReturnType<typeof buildServer>;
  let headers: Record<string, string>;

  beforeEach(() => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    headers = testUser().authHeader;
  });

  it('exports account data across babies, events, growth, reminders, and shares', async () => {
    const babyId = await createTestBaby(app, headers, {
      name: 'Aisyah',
      dateOfBirth: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    });

    const exported = await app.inject({ method: 'GET', url: '/v1/account/export', headers });
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
      headers,
      payload: { reason: 'No longer needed' },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json().status).toBe('pending');

    const list = await app.inject({ method: 'GET', url: '/v1/account/deletion-requests', headers });
    expect(list.json()).toHaveLength(1);

    const cancel = await app.inject({
      method: 'POST',
      url: `/v1/account/deletion-requests/${create.json().id}/cancel`,
      headers,
    });
    expect(cancel.json().status).toBe('cancelled');
  });

  it("cannot export another user's account", async () => {
    await createTestBaby(app, headers);
    const otherHeaders = testUser().authHeader;
    const exported = await app.inject({ method: 'GET', url: '/v1/account/export', headers: otherHeaders });
    expect(exported.json().babies).toHaveLength(0);
  });

  it('rejects a request with no access token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/account/export' });
    expect(response.statusCode).toBe(401);
  });
});
