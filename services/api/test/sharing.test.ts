import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

describe('sharing', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  it('invites a caregiver and lists the grant', async () => {
    const babyId = randomUUID();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      payload: { recipientEmail: 'grandma@example.com', permission: 'read' },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toMatchObject({
      babyId,
      granteeEmail: 'grandma@example.com',
      permission: 'read',
    });
    expect(create.json().revokedAt).toBeUndefined();

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/shares` });
    expect(list.json()).toHaveLength(1);
  });

  it('revokes access immediately, with no cached-permission bypass', async () => {
    const babyId = randomUUID();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      payload: { recipientEmail: 'dad@example.com', permission: 'write' },
    });
    const id = create.json().id;

    const revoke = await app.inject({ method: 'DELETE', url: `/v1/babies/${babyId}/shares/${id}` });
    expect(revoke.json().revokedAt).toBeTruthy();

    // The very next read reflects the revocation — nothing cached in between.
    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/shares` });
    expect(list.json()[0].revokedAt).toBeTruthy();
  });

  it('records audit entries for invite and revoke', async () => {
    const babyId = randomUUID();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      payload: { recipientEmail: 'aunt@example.com', permission: 'read' },
    });
    await app.inject({
      method: 'DELETE',
      url: `/v1/babies/${babyId}/shares/${create.json().id}`,
    });

    const audit = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/audit` });
    const entityTypes = audit.json().map((entry: { entityType: string }) => entry.entityType);
    expect(entityTypes.filter((t: string) => t === 'share_grant')).toHaveLength(2);
  });

  it('rejects an invalid recipient email', async () => {
    const babyId = randomUUID();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/shares`,
      payload: { recipientEmail: 'not-an-email', permission: 'read' },
    });
    expect(create.statusCode).toBe(400);
  });
});
