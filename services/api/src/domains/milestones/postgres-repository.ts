import { Pool } from 'pg';
import { MilestoneRepository, StoredMilestone } from './repository.js';

export class PostgresMilestoneRepository implements MilestoneRepository {
  constructor(private db: Pool) {}

  async list(babyId: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM milestones WHERE baby_id = $1 ORDER BY achieved_at ASC`,
      [babyId],
    );
    return rows.map(toStoredMilestone);
  }

  async upsert(input: {
    id: string;
    babyId: string;
    milestoneId: string;
    achievedAt: Date;
    celebrated: boolean;
  }) {
    const { rows } = await this.db.query(
      `INSERT INTO milestones (id, baby_id, milestone_id, achieved_at, celebrated, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (baby_id, milestone_id)
       DO UPDATE SET achieved_at = EXCLUDED.achieved_at, celebrated = EXCLUDED.celebrated, updated_at = now()
       RETURNING *`,
      [input.id, input.babyId, input.milestoneId, input.achievedAt, input.celebrated],
    );
    return toStoredMilestone(rows[0]);
  }

  async remove(babyId: string, milestoneId: string) {
    const { rows } = await this.db.query(
      `DELETE FROM milestones WHERE baby_id = $1 AND milestone_id = $2 RETURNING *`,
      [babyId, milestoneId],
    );
    return rows[0] ? toStoredMilestone(rows[0]) : undefined;
  }
}

function toStoredMilestone(row: Record<string, unknown>): StoredMilestone {
  return {
    id: row.id as string,
    babyId: row.baby_id as string,
    milestoneId: row.milestone_id as string,
    achievedAt: row.achieved_at as Date,
    celebrated: row.celebrated as boolean,
    updatedAt: row.updated_at as Date,
  };
}
