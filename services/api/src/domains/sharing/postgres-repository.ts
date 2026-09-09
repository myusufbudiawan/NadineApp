import { Pool } from 'pg';
import { ShareRepository, StoredShareGrant } from './repository.js';

export class PostgresShareRepository implements ShareRepository {
  constructor(private db: Pool) {}

  async list(babyId: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM share_grants WHERE baby_id = $1 ORDER BY created_at ASC`,
      [babyId],
    );
    return rows.map(toStoredShareGrant);
  }

  async listByEmail(granteeEmail: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM share_grants WHERE grantee_email = $1 ORDER BY created_at ASC`,
      [granteeEmail],
    );
    return rows.map(toStoredShareGrant);
  }

  async get(id: string) {
    const { rows } = await this.db.query(`SELECT * FROM share_grants WHERE id = $1`, [id]);
    return rows[0] ? toStoredShareGrant(rows[0]) : undefined;
  }

  async create(grant: StoredShareGrant) {
    await this.db.query(
      `INSERT INTO share_grants (id, baby_id, grantee_email, permission, created_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [grant.id, grant.babyId, grant.granteeEmail, grant.permission, grant.createdAt, grant.revokedAt ?? null],
    );
    return grant;
  }

  async update(grant: StoredShareGrant) {
    await this.db.query(`UPDATE share_grants SET revoked_at = $2 WHERE id = $1`, [
      grant.id,
      grant.revokedAt ?? null,
    ]);
    return grant;
  }
}

function toStoredShareGrant(row: Record<string, unknown>): StoredShareGrant {
  return {
    id: row.id as string,
    babyId: row.baby_id as string,
    granteeEmail: row.grantee_email as string,
    permission: row.permission as StoredShareGrant['permission'],
    createdAt: row.created_at as Date,
    revokedAt: (row.revoked_at as Date | null) ?? undefined,
  };
}
