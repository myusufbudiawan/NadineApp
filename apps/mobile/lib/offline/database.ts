import * as SQLite from 'expo-sqlite';

// Caches the open+migrate *promise*, not the resolved database — every
// screen's useFocusEffect calls getDatabase() independently (Home, Track,
// Growth, ...), and on Android in particular, firing several concurrent
// SQLite.openDatabaseAsync() calls for the same file (which happened when
// this only cached the resolved value: two calls could both see the cache
// empty before the first one's await settled) corrupts the native handle —
// surfaced as "NativeDatabase.prepareAsync ... NullPointerException" after
// navigating to/from a screen a few times. Caching the in-flight promise
// guarantees SQLite.openDatabaseAsync runs exactly once; every caller,
// concurrent or not, awaits that same promise.
let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync('preemietrack.db');
  await database.execAsync(
    `PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS baby_profiles (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS mutation_queue (id TEXT PRIMARY KEY NOT NULL, entity_type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, sync_state TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS care_events (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, type TEXT NOT NULL, occurred_at TEXT NOT NULL, data TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE INDEX IF NOT EXISTS care_events_baby_type_idx ON care_events (baby_id, type, occurred_at DESC);
    CREATE TABLE IF NOT EXISTS growth_measurements (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, unit TEXT NOT NULL, measured_at TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS growth_measurements_baby_metric_idx ON growth_measurements (baby_id, metric, measured_at);
    CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, time_of_day TEXT NOT NULL, days_of_week TEXT NOT NULL, timezone TEXT NOT NULL, enabled INTEGER NOT NULL, status TEXT NOT NULL, snoozed_until TEXT, last_completed_at TEXT, notification_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS reminders_baby_idx ON reminders (baby_id);`,
  );
  return database;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate().catch((error) => {
      // Don't cache a permanently rejected promise — let the next call retry.
      dbPromise = undefined;
      throw error;
    });
  }
  return dbPromise;
}
export async function saveProfile(id: string, payload: string) {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO baby_profiles (id, payload, updated_at) VALUES (?, ?, ?)',
    id,
    payload,
    new Date().toISOString(),
  );
}

export async function getProfile(id: string): Promise<string | undefined> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ payload: string }>(
    'SELECT payload FROM baby_profiles WHERE id = ?',
    id,
  );
  return rows[0]?.payload;
}
export async function queueMutation(
  id: string,
  entityType: string,
  payload: string,
) {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO mutation_queue (id, entity_type, payload, created_at, sync_state) VALUES (?, ?, ?, ?, ?)',
    id,
    entityType,
    payload,
    new Date().toISOString(),
    'pending',
  );
}

export type CareEventRow = {
  id: string;
  baby_id: string;
  type: string;
  occurred_at: string;
  data: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function insertCareEvent(event: {
  id: string;
  babyId: string;
  type: string;
  occurredAt: string;
  data: unknown;
  notes?: string;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO care_events (id, baby_id, type, occurred_at, data, notes, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)',
    event.id,
    event.babyId,
    event.type,
    event.occurredAt,
    JSON.stringify(event.data),
    event.notes ?? null,
    now,
    now,
  );
}

export async function updateCareEvent(
  id: string,
  patch: { occurredAt?: string; data?: unknown; notes?: string },
) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CareEventRow>(
    'SELECT * FROM care_events WHERE id = ?',
    id,
  );
  const existing = rows[0];
  if (!existing) throw new Error('Care event not found');
  const occurredAt = patch.occurredAt ?? existing.occurred_at;
  const data = patch.data !== undefined ? JSON.stringify(patch.data) : existing.data;
  const notes = patch.notes !== undefined ? patch.notes : existing.notes;
  await database.runAsync(
    'UPDATE care_events SET occurred_at = ?, data = ?, notes = ?, updated_at = ? WHERE id = ?',
    occurredAt,
    data,
    notes,
    new Date().toISOString(),
    id,
  );
}

export async function softDeleteCareEvent(id: string) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE care_events SET deleted_at = ? WHERE id = ?',
    new Date().toISOString(),
    id,
  );
}

export async function listCareEvents(babyId: string, type?: string) {
  const database = await getDatabase();
  if (type) {
    return database.getAllAsync<CareEventRow>(
      'SELECT * FROM care_events WHERE baby_id = ? AND type = ? AND deleted_at IS NULL ORDER BY occurred_at DESC',
      babyId,
      type,
    );
  }
  return database.getAllAsync<CareEventRow>(
    'SELECT * FROM care_events WHERE baby_id = ? AND deleted_at IS NULL ORDER BY occurred_at DESC',
    babyId,
  );
}

export async function listCareEventsSince(babyId: string, sinceIso: string) {
  const database = await getDatabase();
  return database.getAllAsync<CareEventRow>(
    'SELECT * FROM care_events WHERE baby_id = ? AND occurred_at >= ? AND deleted_at IS NULL ORDER BY occurred_at DESC',
    babyId,
    sinceIso,
  );
}

export type GrowthMeasurementRow = {
  id: string;
  baby_id: string;
  metric: string;
  value: number;
  unit: string;
  measured_at: string;
  created_at: string;
};

export async function insertGrowthMeasurement(measurement: {
  id: string;
  babyId: string;
  metric: string;
  value: number;
  unit: string;
  measuredAt: string;
}) {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO growth_measurements (id, baby_id, metric, value, unit, measured_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    measurement.id,
    measurement.babyId,
    measurement.metric,
    measurement.value,
    measurement.unit,
    measurement.measuredAt,
    new Date().toISOString(),
  );
}

export async function listGrowthMeasurements(babyId: string, metric: string) {
  const database = await getDatabase();
  return database.getAllAsync<GrowthMeasurementRow>(
    'SELECT * FROM growth_measurements WHERE baby_id = ? AND metric = ? ORDER BY measured_at ASC',
    babyId,
    metric,
  );
}

export type ReminderRow = {
  id: string;
  baby_id: string;
  type: string;
  title: string;
  time_of_day: string;
  days_of_week: string;
  timezone: string;
  enabled: number;
  status: string;
  snoozed_until: string | null;
  last_completed_at: string | null;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function insertReminder(reminder: {
  id: string;
  babyId: string;
  type: string;
  title: string;
  timeOfDay: string;
  daysOfWeek: number[];
  timezone: string;
  enabled: boolean;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT INTO reminders (id, baby_id, type, title, time_of_day, days_of_week, timezone, enabled, status, snoozed_until, last_completed_at, notification_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)',
    reminder.id,
    reminder.babyId,
    reminder.type,
    reminder.title,
    reminder.timeOfDay,
    JSON.stringify(reminder.daysOfWeek),
    reminder.timezone,
    reminder.enabled ? 1 : 0,
    'pending',
    now,
    now,
  );
}

export async function getReminder(id: string): Promise<ReminderRow | undefined> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>('SELECT * FROM reminders WHERE id = ?', id);
  return rows[0];
}

export async function listReminders(babyId: string) {
  const database = await getDatabase();
  return database.getAllAsync<ReminderRow>(
    'SELECT * FROM reminders WHERE baby_id = ? ORDER BY time_of_day ASC',
    babyId,
  );
}

export async function updateReminder(
  id: string,
  patch: {
    title?: string;
    timeOfDay?: string;
    daysOfWeek?: number[];
    timezone?: string;
    enabled?: boolean;
    status?: string;
    snoozedUntil?: string | null;
    lastCompletedAt?: string | null;
    notificationId?: string | null;
  },
) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>('SELECT * FROM reminders WHERE id = ?', id);
  const existing = rows[0];
  if (!existing) throw new Error('Reminder not found');
  await database.runAsync(
    'UPDATE reminders SET title = ?, time_of_day = ?, days_of_week = ?, timezone = ?, enabled = ?, status = ?, snoozed_until = ?, last_completed_at = ?, notification_id = ?, updated_at = ? WHERE id = ?',
    patch.title ?? existing.title,
    patch.timeOfDay ?? existing.time_of_day,
    patch.daysOfWeek ? JSON.stringify(patch.daysOfWeek) : existing.days_of_week,
    patch.timezone ?? existing.timezone,
    patch.enabled === undefined ? existing.enabled : patch.enabled ? 1 : 0,
    patch.status ?? existing.status,
    patch.snoozedUntil === undefined ? existing.snoozed_until : patch.snoozedUntil,
    patch.lastCompletedAt === undefined ? existing.last_completed_at : patch.lastCompletedAt,
    patch.notificationId === undefined ? existing.notification_id : patch.notificationId,
    new Date().toISOString(),
    id,
  );
}

export async function deleteReminder(id: string) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM reminders WHERE id = ?', id);
}

export async function getLatestCareEventsByType(babyId: string) {
  const database = await getDatabase();
  return database.getAllAsync<CareEventRow>(
    `SELECT ce.* FROM care_events ce
     INNER JOIN (
       SELECT type, MAX(occurred_at) AS max_occurred_at FROM care_events
       WHERE baby_id = ? AND deleted_at IS NULL GROUP BY type
     ) latest ON ce.type = latest.type AND ce.occurred_at = latest.max_occurred_at
     WHERE ce.baby_id = ? AND ce.deleted_at IS NULL`,
    babyId,
    babyId,
  );
}
