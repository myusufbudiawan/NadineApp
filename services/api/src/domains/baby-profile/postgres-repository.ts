import { Pool } from 'pg';
import { BabyRepository, StoredBaby } from './repository.js';

export class PostgresBabyRepository implements BabyRepository {
  constructor(private db: Pool) {}

  async list(userId: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM babies WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    return rows.map(toStoredBaby);
  }

  async create(baby: StoredBaby) {
    await this.db.query(
      `INSERT INTO babies (id, user_id, name, sex, date_of_birth, gestational_weeks, gestational_days,
         birth_weight_kg, birth_length_cm, birth_head_circumference_cm, full_term_reference_weeks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        baby.id,
        baby.userId,
        baby.name,
        baby.sex,
        baby.dateOfBirth,
        baby.gestationalWeeks,
        baby.gestationalDays,
        baby.birthWeightKg,
        baby.birthLengthCm ?? null,
        baby.birthHeadCircumferenceCm ?? null,
        baby.fullTermReferenceWeeks,
      ],
    );
    return baby;
  }

  async update(id: string, patch: Partial<StoredBaby>) {
    const existing = await this.get(id);
    if (!existing) throw new Error('Baby not found');
    const updated = { ...existing, ...patch };
    await this.db.query(
      `UPDATE babies SET name = $2, sex = $3, date_of_birth = $4, gestational_weeks = $5, gestational_days = $6,
         birth_weight_kg = $7, birth_length_cm = $8, birth_head_circumference_cm = $9,
         full_term_reference_weeks = $10, updated_at = now()
       WHERE id = $1`,
      [
        id,
        updated.name,
        updated.sex,
        updated.dateOfBirth,
        updated.gestationalWeeks,
        updated.gestationalDays,
        updated.birthWeightKg,
        updated.birthLengthCm ?? null,
        updated.birthHeadCircumferenceCm ?? null,
        updated.fullTermReferenceWeeks,
      ],
    );
    return updated;
  }

  async get(id: string) {
    const { rows } = await this.db.query(`SELECT * FROM babies WHERE id = $1`, [id]);
    return rows[0] ? toStoredBaby(rows[0]) : undefined;
  }
}

function toStoredBaby(row: Record<string, unknown>): StoredBaby {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    sex: row.sex as StoredBaby['sex'],
    dateOfBirth: row.date_of_birth as Date,
    gestationalWeeks: row.gestational_weeks as number,
    gestationalDays: row.gestational_days as number,
    birthWeightKg: Number(row.birth_weight_kg),
    birthLengthCm: row.birth_length_cm === null ? undefined : Number(row.birth_length_cm),
    birthHeadCircumferenceCm:
      row.birth_head_circumference_cm === null
        ? undefined
        : Number(row.birth_head_circumference_cm),
    fullTermReferenceWeeks: row.full_term_reference_weeks as number,
  };
}
