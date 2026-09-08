import { Pool } from 'pg';
import { ContentRepository, StoredTipContent } from './repository.js';
import { ReviewStatus, TipCategory } from './schema.js';

export class PostgresContentRepository implements ContentRepository {
  constructor(private db: Pool) {}

  async list() {
    const { rows } = await this.db.query(`SELECT * FROM tip_content ORDER BY created_at ASC`);
    return rows.map(toStoredTipContent);
  }

  async create(tip: StoredTipContent) {
    await this.db.query(
      `INSERT INTO tip_content (id, title, body, category, min_corrected_age_days, max_corrected_age_days,
         source, review_status, reviewed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tip.id,
        tip.title,
        tip.body,
        tip.category,
        tip.minCorrectedAgeDays ?? null,
        tip.maxCorrectedAgeDays ?? null,
        tip.source,
        tip.reviewStatus,
        tip.reviewedAt ?? null,
        tip.createdAt,
      ],
    );
    return tip;
  }
}

function toStoredTipContent(row: Record<string, unknown>): StoredTipContent {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    category: row.category as TipCategory,
    minCorrectedAgeDays: (row.min_corrected_age_days as number | null) ?? undefined,
    maxCorrectedAgeDays: (row.max_corrected_age_days as number | null) ?? undefined,
    source: row.source as string,
    reviewStatus: row.review_status as ReviewStatus,
    reviewedAt: (row.reviewed_at as Date | null) ?? undefined,
    createdAt: row.created_at as Date,
  };
}
