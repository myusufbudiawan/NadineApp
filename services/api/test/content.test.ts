import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

describe('tips content', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  it('never returns needs-clinical-review content by default', async () => {
    const list = await app.inject({ method: 'GET', url: '/v1/tips' });
    const reviewStatuses = list.json().map((tip: { reviewStatus: string }) => tip.reviewStatus);
    expect(reviewStatuses).not.toContain('needs-clinical-review');
    expect(reviewStatuses).not.toContain('draft');
  });

  it('returns an approved tip authored through the create endpoint', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/tips',
      payload: {
        title: 'Skin-to-skin basics',
        body: 'Approved copy.',
        category: 'kangaroo-care',
        source: 'clinical-advisor-review-2026',
        reviewStatus: 'approved',
      },
    });
    expect(create.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/v1/tips' });
    const titles = list.json().map((tip: { title: string }) => tip.title);
    expect(titles).toContain('Skin-to-skin basics');
  });

  it('filters by category and corrected-age eligibility', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/tips',
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

    const inRange = await app.inject({
      method: 'GET',
      url: '/v1/tips?category=feeding&correctedAgeDays=-10',
    });
    expect(inRange.json()).toHaveLength(1);

    const outOfRange = await app.inject({
      method: 'GET',
      url: '/v1/tips?category=feeding&correctedAgeDays=30',
    });
    expect(outOfRange.json()).toHaveLength(0);
  });
});
