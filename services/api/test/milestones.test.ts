import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { createTestBaby, testTokenVerifier, testUser } from './helpers/auth.js';

describe('milestones', () => {
  let app: ReturnType<typeof buildServer>;
  let babyId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    headers = testUser().authHeader;
    babyId = await createTestBaby(app, headers);
  });

  it('marks and lists a milestone', async () => {
    const put = await app.inject({
      method: 'PUT',
      url: `/v1/babies/${babyId}/milestones/off-cpap`,
      headers,
      payload: { achievedAt: new Date().toISOString(), celebrated: false },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json()).toMatchObject({ milestoneId: 'off-cpap', celebrated: false });

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/milestones`,
      headers,
    });
    expect(list.json()).toHaveLength(1);
    expect(list.json()[0].milestoneId).toBe('off-cpap');
  });

  it('upserts in place rather than duplicating on a second mark', async () => {
    const firstDate = new Date('2026-01-01').toISOString();
    const secondDate = new Date('2026-01-05').toISOString();

    await app.inject({
      method: 'PUT',
      url: `/v1/babies/${babyId}/milestones/discharged`,
      headers,
      payload: { achievedAt: firstDate, celebrated: false },
    });
    const second = await app.inject({
      method: 'PUT',
      url: `/v1/babies/${babyId}/milestones/discharged`,
      headers,
      payload: { achievedAt: secondDate, celebrated: true },
    });
    expect(second.json()).toMatchObject({ celebrated: true });

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/milestones`,
      headers,
    });
    expect(list.json()).toHaveLength(1);
    expect(new Date(list.json()[0].achievedAt).toISOString()).toBe(secondDate);
  });

  it('removes a milestone', async () => {
    await app.inject({
      method: 'PUT',
      url: `/v1/babies/${babyId}/milestones/two-kilos`,
      headers,
      payload: { achievedAt: new Date().toISOString() },
    });
    const del = await app.inject({
      method: 'DELETE',
      url: `/v1/babies/${babyId}/milestones/two-kilos`,
      headers,
    });
    expect(del.statusCode).toBe(204);

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/milestones`,
      headers,
    });
    expect(list.json()).toHaveLength(0);
  });

  it('rejects access from a user with no access to the baby', async () => {
    const otherHeaders = testUser('other@example.com').authHeader;
    const response = await app.inject({
      method: 'PUT',
      url: `/v1/babies/${babyId}/milestones/off-cpap`,
      headers: otherHeaders,
      payload: { achievedAt: new Date().toISOString() },
    });
    expect(response.statusCode).toBe(403);
  });
});
