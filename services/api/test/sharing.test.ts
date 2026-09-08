import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { createTestBaby, testTokenVerifier, testUser } from './helpers/auth.js';

describe('sharing', () => {
  let app: ReturnType<typeof buildServer>;
  let babyId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    headers = testUser().authHeader;
    babyId = await createTestBaby(app, headers);
  });

  it('invites a caregiver and lists the grant', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      headers,
      payload: { recipientEmail: 'grandma@example.com', permission: 'read' },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toMatchObject({
      babyId,
      granteeEmail: 'grandma@example.com',
      permission: 'read',
    });
    expect(create.json().revokedAt).toBeUndefined();

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/shares`, headers });
    expect(list.json()).toHaveLength(1);
  });

  it('revokes access immediately, with no cached-permission bypass', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      headers,
      payload: { recipientEmail: 'dad@example.com', permission: 'write' },
    });
    const id = create.json().id;

    const revoke = await app.inject({
      method: 'DELETE',
      url: `/v1/babies/${babyId}/shares/${id}`,
      headers,
    });
    expect(revoke.json().revokedAt).toBeTruthy();

    // The very next read reflects the revocation — nothing cached in between.
    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/shares`, headers });
    expect(list.json()[0].revokedAt).toBeTruthy();
  });

  it('records audit entries for invite and revoke', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      headers,
      payload: { recipientEmail: 'aunt@example.com', permission: 'read' },
    });
    await app.inject({
      method: 'DELETE',
      url: `/v1/babies/${babyId}/shares/${create.json().id}`,
      headers,
    });

    const audit = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/audit`, headers });
    const entityTypes = audit.json().map((entry: { entityType: string }) => entry.entityType);
    expect(entityTypes.filter((t: string) => t === 'share_grant')).toHaveLength(2);
  });

  it('rejects an invalid recipient email', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      headers,
      payload: { recipientEmail: 'not-an-email', permission: 'read' },
    });
    expect(create.statusCode).toBe(400);
  });

  it('a write-access collaborator can log care events but not manage shares', async () => {
    const collaborator = testUser('collaborator@example.com');
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      headers,
      payload: { recipientEmail: collaborator.email, permission: 'write' },
    });

    const logEvent = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      headers: collaborator.authHeader,
      payload: {
        type: 'feeding',
        occurredAt: new Date().toISOString(),
        data: { method: 'bottle', amount: 30, unit: 'ml' },
        idempotencyKey: crypto.randomUUID(),
      },
    });
    expect(logEvent.statusCode).toBe(201);

    const inviteAnother = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      headers: collaborator.authHeader,
      payload: { recipientEmail: 'someone-else@example.com', permission: 'read' },
    });
    expect(inviteAnother.statusCode).toBe(403);
  });
});
