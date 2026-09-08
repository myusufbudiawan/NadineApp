import { Pool } from 'pg';
import { SyncMutationResult, SyncRepository } from './repository.js';

export class PostgresSyncRepository implements SyncRepository {
  constructor(private db: Pool) {}

  async findResult(mutationId: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM sync_results WHERE mutation_id = $1`,
      [mutationId],
    );
    return rows[0] ? toSyncMutationResult(rows[0]) : undefined;
  }

  async saveResult(result: SyncMutationResult) {
    await this.db.query(
      `INSERT INTO sync_results (mutation_id, status, event, server_event, error)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (mutation_id) DO UPDATE
         SET status = $2, event = $3, server_event = $4, error = $5`,
      [
        result.id,
        result.status,
        result.event ? JSON.stringify(result.event) : null,
        result.serverEvent ? JSON.stringify(result.serverEvent) : null,
        result.error ?? null,
      ],
    );
  }
}

function toSyncMutationResult(row: Record<string, unknown>): SyncMutationResult {
  return {
    id: row.mutation_id as string,
    status: row.status as SyncMutationResult['status'],
    event: row.event ?? undefined,
    serverEvent: row.server_event ?? undefined,
    error: (row.error as string | null) ?? undefined,
  };
}
