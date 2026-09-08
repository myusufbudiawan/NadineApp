import { Pool } from 'pg';
import { ReminderRepository, ReminderStatus, StoredReminder } from './repository.js';
import { ReminderType } from './schema.js';

export class PostgresReminderRepository implements ReminderRepository {
  constructor(private db: Pool) {}

  async list(babyId: string) {
    const { rows } = await this.db.query(
      `SELECT * FROM reminders WHERE baby_id = $1 ORDER BY created_at ASC`,
      [babyId],
    );
    return rows.map(toStoredReminder);
  }

  async get(id: string) {
    const { rows } = await this.db.query(`SELECT * FROM reminders WHERE id = $1`, [id]);
    return rows[0] ? toStoredReminder(rows[0]) : undefined;
  }

  async create(reminder: StoredReminder) {
    await this.db.query(
      `INSERT INTO reminders (id, baby_id, type, title, time_of_day, days_of_week, timezone, enabled,
         status, snoozed_until, last_completed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        reminder.id,
        reminder.babyId,
        reminder.type,
        reminder.title,
        reminder.timeOfDay,
        reminder.daysOfWeek,
        reminder.timezone,
        reminder.enabled,
        reminder.status,
        reminder.snoozedUntil ?? null,
        reminder.lastCompletedAt ?? null,
        reminder.createdAt,
        reminder.updatedAt,
      ],
    );
    return reminder;
  }

  async update(reminder: StoredReminder) {
    await this.db.query(
      `UPDATE reminders SET type = $2, title = $3, time_of_day = $4, days_of_week = $5, timezone = $6,
         enabled = $7, status = $8, snoozed_until = $9, last_completed_at = $10, updated_at = $11
       WHERE id = $1`,
      [
        reminder.id,
        reminder.type,
        reminder.title,
        reminder.timeOfDay,
        reminder.daysOfWeek,
        reminder.timezone,
        reminder.enabled,
        reminder.status,
        reminder.snoozedUntil ?? null,
        reminder.lastCompletedAt ?? null,
        reminder.updatedAt,
      ],
    );
    return reminder;
  }
}

function toStoredReminder(row: Record<string, unknown>): StoredReminder {
  return {
    id: row.id as string,
    babyId: row.baby_id as string,
    type: row.type as ReminderType,
    title: row.title as string,
    timeOfDay: row.time_of_day as string,
    daysOfWeek: row.days_of_week as number[],
    timezone: row.timezone as string,
    enabled: row.enabled as boolean,
    status: row.status as ReminderStatus,
    snoozedUntil: (row.snoozed_until as Date | null) ?? undefined,
    lastCompletedAt: (row.last_completed_at as Date | null) ?? undefined,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
