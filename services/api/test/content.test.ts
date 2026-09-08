import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { testTokenVerifier, testUser } from './helpers/auth.js';

describe('tips content', () => {
  let app: ReturnType<typeof buildServer>;
  let headers: Record<string, string>;

  beforeEach(() => {
    app = buildServer({ tokenVerifier: testTokenVerifier });
    headers = testUser().authHeader;
  });

  it('never returns needs-clinical-review content by default', async () => {
    const list = await app.inject({ method: 'GET', url: '/v1/tips', headers });
    const reviewStatuses = list.json().map((tip: { reviewStatus: string }) => tip.reviewStatus);
    expect(reviewStatuses).not.toContain('needs-clinical-review');
    expect(reviewStatuses).not.toContain('draft');
  });

  it('returns an approved tip authored through the create endpoint', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/tips',
      headers,
      payload: {
        title: 'Skin-to-skin basics',
        body: 'Approved copy.',
        category: 'kangaroo-care',
        source: 'clinical-advisor-review-2026',
        reviewStatus: 'approved',
      },
    });
    expect(create.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/v1/tips', headers });
    const titles = list.json().map((tip: { title: string }) => tip.title);
    expect(titles).toContain('Skin-to-skin basics');
  });

  it('filters by category and corrected-age eligibility', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/tips',
      headers,
      payload: {
        title: 'Early days feeding',
        body: 'Approved copy.',
        category: 'feeding',
        source: 'clinical-advisor-review-2026',
        reviewStatus: 'approved',
        minCorrectedAgeDays: -60,
        maxCorrectedAgeDays: 0,
      },
    });

    // Assertions check presence/absence rather than exact counts: this suite
    // runs against a real, persistent Supabase database (no per-run reset),
    // so earlier runs' approved tips may still be present.
    const inRange = await app.inject({
      method: 'GET',
      url: '/v1/tips?category=feeding&correctedAgeDays=-10',
      headers,
    });
    expect(
      inRange.json().some((tip: { title: string }) => tip.title === 'Early days feeding'),
    ).toBe(true);

    const outOfRange = await app.inject({
      method: 'GET',
      url: '/v1/tips?category=feeding&correctedAgeDays=30',
      headers,
    });
    expect(
      outOfRange.json().some((tip: { title: string }) => tip.title === 'Early days feeding'),
    ).toBe(false);
  });

  it('rejects a request with no access token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/tips' });
    expect(response.statusCode).toBe(401);
  });
});
