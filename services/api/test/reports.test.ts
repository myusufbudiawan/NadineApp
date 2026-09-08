import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { createTestBaby, testTokenVerifier, testUser } from './helpers/auth.js';

describe('reports', () => {
  let app: ReturnType<typeof buildServer>;
  let headers: Record<string, string>;

  beforeEach(() => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    headers = testUser().authHeader;
  });

  async function createBaby() {
    return createTestBaby(app, headers, { name: 'Aisyah' });
  }

  it('generates a report with age context, care events, and measurements', async () => {
    const babyId = await createBaby();
    const idempotencyKey = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      headers,
      payload: {
        type: 'feeding',
        occurredAt: new Date().toISOString(),
        data: { method: 'bottle', amount: 36, unit: 'ml' },
        idempotencyKey,
      },
    });
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: { metric: 'weight', value: 1.68, unit: 'kg', measuredAt: new Date().toISOString() },
    });

    const from = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    const report = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reports`,
      headers,
      payload: { from, to },
    });

    expect(report.statusCode).toBe(200);
    const body = report.json();
    expect(body.babyProfile.name).toBe('Aisyah');
    expect(body.ageContext.actualAge.totalDays).toBeGreaterThanOrEqual(29);
    expect(body.careEventSummary).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'feeding', count: 1 })]),
    );
    expect(body.measurements).toHaveLength(1);
    expect(body.measurements[0]).toMatchObject({ metric: 'weight', value: 1.68, unit: 'kg' });
  });

  it('filters by category', async () => {
    const babyId = await createBaby();
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      headers,
      payload: {
        type: 'diaper',
        occurredAt: new Date().toISOString(),
        data: { diaperType: 'wet' },
        idempotencyKey: randomUUID(),
      },
    });
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: { metric: 'weight', value: 1.68, unit: 'kg', measuredAt: new Date().toISOString() },
    });

    const from = new Date(Date.now() - 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    const report = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reports`,
      headers,
      payload: { from, to, categories: ['diaper'] },
    });

    const body = report.json();
    expect(body.careEventSummary).toHaveLength(1);
    expect(body.measurements).toHaveLength(0);
  });

  it('exports as CSV when requested', async () => {
    const babyId = await createBaby();
    const from = new Date(Date.now() - 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    const report = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reports`,
      headers,
      payload: { from, to, format: 'csv' },
    });

    expect(report.statusCode).toBe(200);
    expect(report.headers['content-type']).toContain('text/csv');
    expect(report.body).toContain('section,type,id,timestamp,value,unit,notes');
  });

  it('sharing a report never creates a ShareGrant', async () => {
    const babyId = await createBaby();
    const from = new Date(Date.now() - 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reports`,
      headers,
      payload: { from, to },
    });

    const shares = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/shares`, headers });
    expect(shares.json()).toHaveLength(0);
  });
});
