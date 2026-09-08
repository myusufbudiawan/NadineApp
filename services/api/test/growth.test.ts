import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { createTestBaby, testTokenVerifier, testUser } from './helpers/auth.js';

function weightPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    metric: 'weight',
    value: 1.68,
    unit: 'kg',
    measuredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('growth measurements', () => {
  let app: ReturnType<typeof buildServer>;
  let babyId: string;
  let headers: Record<string, string>;

  beforeEach(async () => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    headers = testUser().authHeader;
    babyId = await createTestBaby(app, headers);
  });

  it('creates and lists a measurement', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: weightPayload(),
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toMatchObject({ metric: 'weight', value: 1.68, unit: 'kg' });

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/growth`,
      headers,
    });
    expect(list.json()).toHaveLength(1);
  });

  it('filters listing by metric', async () => {
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: weightPayload(),
    });
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: weightPayload({ metric: 'length', value: 40, unit: 'cm' }),
    });

    const list = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/growth?metric=length`,
      headers,
    });
    const results = list.json();
    expect(results).toHaveLength(1);
    expect(results[0].metric).toBe('length');
  });

  it('rejects an implausible value', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: weightPayload({ value: 999 }),
    });
    expect(response.statusCode).toBe(400);
  });

  it('records an audit entry on create', async () => {
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/growth`,
      headers,
      payload: weightPayload(),
    });
    const audit = await app.inject({
      method: 'GET',
      url: `/v1/babies/${babyId}/audit`,
      headers,
    });
    const entityTypes = audit.json().map((entry: { entityType: string }) => entry.entityType);
    expect(entityTypes).toContain('growth_measurement');
  });
});
