import { Pool } from 'pg';
import { DeletionRequestRepository, DeletionRequestStatus, StoredDeletionRequest } from './repository.js';

export class PostgresDeletionRequestRepository implements DeletionRequestRepository {
  constructor(private db: Pool) {}

  async create(request: StoredDeletionRequest) {
    await this.db.query(
      `INSERT INTO deletion_requests (id, user_id, reason, status, requested_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [request.id, request.userId, request.reason ?? null, request.status, request.requestedAt, request.updatedAt],
    );
    return request;
  }

  async listByUser(userId: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM deletion_requests WHERE user_id = $1 ORDER BY requested_at DESC`,
      [userId],
    );
    return rows.map(toStoredDeletionRequest);
  }

  async get(id: string) {
    const { rows } = await this.db.query(`SELECT * FROM deletion_requests WHERE id = $1`, [id]);
    return rows[0] ? toStoredDeletionRequest(rows[0]) : undefined;
  }

  async update(request: StoredDeletionRequest) {
    await this.db.query(
      `UPDATE deletion_requests SET status = $2, updated_at = $3 WHERE id = $1`,
      [request.id, request.status, request.updatedAt],
    );
    return request;
  }
}

function toStoredDeletionRequest(row: Record<string, unknown>): StoredDeletionRequest {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    reason: (row.reason as string | null) ?? undefined,
    status: row.status as DeletionRequestStatus,
    requestedAt: row.requested_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
