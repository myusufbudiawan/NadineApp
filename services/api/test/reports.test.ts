import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

function babyPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: 'Aisyah',
    sex: 'girl',
    dateOfBirth: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    gestationalWeeks: 32,
    gestationalDays: 3,
    birthWeightKg: 1.58,
    fullTermReferenceWeeks: 40,
    ...overrides,
  };
}

describe('reports', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  async function createBaby() {
    const res = await app.inject({ method: 'POST', url: '/v1/babies', payload: babyPayload() });
    return res.json().id as string;
  }

  it('generates a report with age context, care events, and measurements', async () => {
    const babyId = await createBaby();
    const idempotencyKey = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
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
      payload: { metric: 'weight', value: 1.68, unit: 'kg', measuredAt: new Date().toISOString() },
    });

    const from = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    const report = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reports`,
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
      payload: { metric: 'weight', value: 1.68, unit: 'kg', measuredAt: new Date().toISOString() },
    });

    const from = new Date(Date.now() - 86_400_000).toISOString();
    const to = new Date(Date.now() + 86_400_000).toISOString();
    const report = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reports`,
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
    await app.inject({ method: 'POST', url: `/v1/babies/${babyId}/reports`, payload: { from, to } });

    const shares = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/shares` });
    expect(shares.json()).toHaveLength(0);
  });
});
