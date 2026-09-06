import * as SQLite from 'expo-sqlite';
let db: SQLite.SQLiteDatabase | undefined;
export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('preemietrack.db');
    await db.execAsync(
      `PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS baby_profiles (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS mutation_queue (id TEXT PRIMARY KEY NOT NULL, entity_type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, sync_state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS care_events (id TEXT PRIMARY KEY NOT NULL, baby_id TEXT NOT NULL, type TEXT NOT NULL, occurred_at TEXT NOT NULL, data TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
      CREATE INDEX IF NOT EXISTS care_events_baby_type_idx ON care_events (baby_id, type, occurred_at DESC);`,
    );
  }
  return db;
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
