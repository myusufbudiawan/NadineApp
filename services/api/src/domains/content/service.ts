import { randomUUID } from 'node:crypto';
import { ContentRepository } from './repository.js';
import { TipCategory, TipInput } from './schema.js';

/** Clinical content may not be enabled without reviewer approval. */
export class ContentService {
  constructor(private repository: ContentRepository) {}

  // Unfiltered count, used only to decide whether startup seeding is needed
  // (placeholder tips are all 'needs-clinical-review', so list() below would
  // always report zero for them and reseed duplicates on every restart).
  async count() {
    return (await this.repository.list()).length;
  }

  // Only 'approved' content ever reaches a caregiver — 'draft' and
  // 'needs-clinical-review' items exist in storage (so an admin console can
  // list/manage them) but are never returned here (Section 15 guardrail).
  async list(options: { category?: TipCategory; correctedAgeDays?: number } = {}) {
    const all = await this.repository.list();
    return all.filter((tip) => {
      if (tip.reviewStatus !== 'approved') return false;
      if (options.category && tip.category !== options.category) return false;
      if (options.correctedAgeDays === undefined) return true;
      if (tip.minCorrectedAgeDays !== undefined && options.correctedAgeDays < tip.minCorrectedAgeDays) {
        return false;
      }
      if (tip.maxCorrectedAgeDays !== undefined && options.correctedAgeDays > tip.maxCorrectedAgeDays) {
        return false;
      }
      return true;
    });
  }

  // Authoring entry point for the (not-yet-built, see task tracker gap) admin
  // console — content lands here regardless of reviewStatus so it can be
  // reviewed before ever being promoted to 'approved'.
  async create(input: TipInput) {
    const tip = {
      id: randomUUID(),
      title: input.title,
      body: input.body,
      category: input.category,
      minCorrectedAgeDays: input.minCorrectedAgeDays,
      maxCorrectedAgeDays: input.maxCorrectedAgeDays,
      source: input.source,
      reviewStatus: input.reviewStatus,
      reviewedAt: input.reviewStatus === 'approved' ? new Date() : undefined,
      createdAt: new Date(),
    };
    return this.repository.create(tip);
  }
}
