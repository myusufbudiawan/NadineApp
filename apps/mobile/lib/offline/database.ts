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

// SQLite has no "ADD COLUMN IF NOT EXISTS" — an install that already created
// a table before a column was added to this schema needs that column
// bolted on explicitly. Swallow only the "duplicate column" error a fresh
// install (whose CREATE TABLE already includes the column) produces here;
// anything else is a real failure and should surface.
async function addColumnIfMissing(
  database: SQLite.SQLiteDatabase,
  table: string,
  columnDefinition: string,
) {
  try {
    await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition};`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column name/i.test(message)) throw error;
  }
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync('preemietrack.db');
  await database.execAsync(
    `PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS baby_profiles (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS mutation_queue (id TEXT PRIMARY KEY NOT NULL, entity_type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, sync_state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT, last_error TEXT);
    CREATE TABLE IF NOT EXISTS sync_conflicts (id TEXT PRIMARY KEY NOT NULL, mutation_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, local_payload TEXT NOT NULL, server_payload TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS care_events (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, type TEXT NOT NULL, occurred_at TEXT NOT NULL, data TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT, server_updated_at TEXT);
    CREATE INDEX IF NOT EXISTS care_events_baby_type_idx ON care_events (baby_id, type, occurred_at DESC);
    CREATE TABLE IF NOT EXISTS growth_measurements (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, unit TEXT NOT NULL, measured_at TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS growth_measurements_baby_metric_idx ON growth_measurements (baby_id, metric, measured_at);
    CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, time_of_day TEXT NOT NULL, days_of_week TEXT NOT NULL, timezone TEXT NOT NULL, enabled INTEGER NOT NULL, status TEXT NOT NULL, snoozed_until TEXT, last_completed_at TEXT, notification_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS reminders_baby_idx ON reminders (baby_id);`,
  );

  // Phase 5 additions — backfilled onto any pre-existing install (the two
  // CREATE TABLE statements above only take full effect on a brand-new db).
  await addColumnIfMissing(database, 'mutation_queue', 'attempts INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(database, 'mutation_queue', 'next_attempt_at TEXT');
  await addColumnIfMissing(database, 'mutation_queue', 'last_error TEXT');
  await addColumnIfMissing(database, 'care_events', 'server_updated_at TEXT');

  await database.execAsync(
    'CREATE INDEX IF NOT EXISTS mutation_queue_state_idx ON mutation_queue (sync_state, next_attempt_at);',
  );

  return database;
}

// Wipes every local table before reconciling a device whose cached data
// belongs to a different account (see lib/offline/serverBaby.ts) — none of
// these tables are keyed by user id, so a stale row here would otherwise
// leak the previous account's baby/care-events/etc. into the new one.
export async function resetLocalData() {
  const database = await getDatabase();
  await database.execAsync(
    `DELETE FROM baby_profiles;
     DELETE FROM mutation_queue;
     DELETE FROM sync_conflicts;
     DELETE FROM care_events;
     DELETE FROM growth_measurements;
     DELETE FROM reminders;`,
  );
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

export type MutationQueueRow = {
  id: string;
  entity_type: string;
  payload: string;
  created_at: string;
  sync_state: string;
  attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
};

// Only mutations whose backoff window has elapsed (or that have never failed
// yet) are eligible for the next sync attempt (5.1 exponential backoff).
export async function listPendingMutations(): Promise<MutationQueueRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<MutationQueueRow>(
    `SELECT * FROM mutation_queue
     WHERE sync_state = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
     ORDER BY created_at ASC`,
    new Date().toISOString(),
  );
}

export async function markMutationSynced(id: string) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM mutation_queue WHERE id = ?', id);
}

export async function markMutationFailed(
  id: string,
  attempts: number,
  nextAttemptAt: string,
  lastError: string,
) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE mutation_queue SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?',
    attempts,
    nextAttemptAt,
    lastError,
    id,
  );
}

// A conflict is pulled out of the retry loop entirely — retrying a
// conflicting edit against an unchanged expectedUpdatedAt would just produce
// the same conflict forever. It waits here for the caregiver to resolve it.
export async function recordConflict(conflict: {
  id: string;
  mutationId: string;
  entityType: string;
  entityId: string;
  localPayload: unknown;
  serverPayload: unknown;
}) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM mutation_queue WHERE id = ?', conflict.mutationId);
  await database.runAsync(
    'INSERT INTO sync_conflicts (id, mutation_id, entity_type, entity_id, local_payload, server_payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    conflict.id,
    conflict.mutationId,
    conflict.entityType,
    conflict.entityId,
    JSON.stringify(conflict.localPayload),
    JSON.stringify(conflict.serverPayload),
    new Date().toISOString(),
  );
}

export type SyncConflictRow = {
  id: string;
  mutation_id: string;
  entity_type: string;
  entity_id: string;
  local_payload: string;
  server_payload: string;
  created_at: string;
};

export async function listConflicts(): Promise<SyncConflictRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<SyncConflictRow>(
    'SELECT * FROM sync_conflicts ORDER BY created_at ASC',
  );
}

export async function deleteConflict(id: string) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sync_conflicts WHERE id = ?', id);
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
  server_updated_at: string | null;
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

// Cross-device pull (lib/offline/hydrate.ts): the server row's own id is
// used as the local id (care-event creation now always echoes the client's
// original id back — see services/api care-events/service.ts), so re-running
// hydration is naturally idempotent via INSERT OR IGNORE rather than needing
// a separate "does this exist" check.
export async function insertCareEventIfMissing(event: {
  id: string;
  babyId: string;
  type: string;
  occurredAt: string;
  data: unknown;
  notes?: string;
  serverUpdatedAt: string;
}) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT OR IGNORE INTO care_events (id, baby_id, type, occurred_at, data, notes, created_at, updated_at, deleted_at, server_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
    event.id,
    event.babyId,
    event.type,
    event.occurredAt,
    JSON.stringify(event.data),
    event.notes ?? null,
    now,
    now,
    event.serverUpdatedAt,
  );
}

export async function getCareEventById(id: string): Promise<CareEventRow | undefined> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CareEventRow>(
    'SELECT * FROM care_events WHERE id = ?',
    id,
  );
  return rows[0];
}

// Used when a caregiver resolves a conflict by accepting the server's
// version — replaces the local row outright rather than going through the
// normal patch path, since we're not merging, just adopting the server copy.
export async function overwriteCareEventFromServer(event: {
  id: string;
  occurredAt: string;
  data: unknown;
  notes?: string;
  updatedAt: string;
}) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE care_events SET occurred_at = ?, data = ?, notes = ?, updated_at = ?, server_updated_at = ? WHERE id = ?',
    event.occurredAt,
    JSON.stringify(event.data),
    event.notes ?? null,
    event.updatedAt,
    event.updatedAt,
    event.id,
  );
}

// Records the server's canonical updatedAt after a create/update mutation is
// confirmed applied — this, not the locally-touched updated_at, is what the
// next edit's conflict check (expectedUpdatedAt) is based against, so two
// purely-local edits made before either has synced don't spuriously
// conflict with each other.
export async function setServerUpdatedAt(id: string, serverUpdatedAt: string) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE care_events SET server_updated_at = ? WHERE id = ?',
    serverUpdatedAt,
    id,
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

// Cross-device pull (lib/offline/hydrate.ts). Unlike care events, the
// server still mints its own id for growth measurements, so the caller must
// pass the measurement's idempotencyKey (the originating device's local id)
// as `id` here — that's what makes repeat hydration idempotent.
export async function insertGrowthMeasurementIfMissing(measurement: {
  id: string;
  babyId: string;
  metric: string;
  value: number;
  unit: string;
  measuredAt: string;
}) {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO growth_measurements (id, baby_id, metric, value, unit, measured_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
