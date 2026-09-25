// The on-disk shape of a local JSON backup (offline-only build's
// export/import, see lib/offline/backup.ts). Kept free of expo imports so
// __tests__/backup.runner.ts can exercise the validator under plain node.
//
// Column whitelists mirror the CREATE TABLEs in lib/offline/database.ts —
// import only ever writes these columns, never keys taken from the file.

export const BACKUP_APP = 'preemietrack';
export const BACKUP_VERSION = 1;

type TableSpec = { columns: string[]; nullable: string[] };

export const BACKUP_TABLES: Record<string, TableSpec> = {
  baby_profiles: { columns: ['id', 'payload', 'updated_at'], nullable: [] },
  care_events: {
    columns: [
      'id',
      'baby_id',
      'type',
      'occurred_at',
      'data',
      'notes',
      'created_at',
      'updated_at',
      'deleted_at',
      'server_updated_at',
    ],
    nullable: ['notes', 'deleted_at', 'server_updated_at'],
  },
  growth_measurements: {
    columns: ['id', 'baby_id', 'metric', 'value', 'unit', 'measured_at', 'created_at'],
    nullable: [],
  },
  reminders: {
    columns: [
      'id',
      'baby_id',
      'type',
      'title',
      'time_of_day',
      'days_of_week',
      'timezone',
      'enabled',
      'status',
      'snoozed_until',
      'last_completed_at',
      'notification_id',
      'created_at',
      'updated_at',
    ],
    nullable: ['snoozed_until', 'last_completed_at', 'notification_id'],
  },
  milestones: {
    columns: ['milestone_id', 'baby_id', 'achieved_at', 'celebrated', 'updated_at'],
    nullable: [],
  },
};

export type BackupRow = Record<string, string | number | null>;

export type Backup = {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  tables: Record<string, BackupRow[]>;
  prefs?: { dashboardMetrics?: string[] };
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// Throws with a user-readable message on anything that isn't a backup this
// app wrote — the file comes from outside the app, so trust nothing in it.
export function validateBackup(json: unknown): Backup {
  if (!isObject(json) || json.app !== BACKUP_APP) {
    throw new Error("This file isn't a PreemieTrack backup.");
  }
  if (json.version !== BACKUP_VERSION) {
    throw new Error('This backup was made by a different version of PreemieTrack.');
  }
  if (!isObject(json.tables)) throw new Error('This backup is missing its data.');

  const tables: Record<string, BackupRow[]> = {};
  for (const [name, spec] of Object.entries(BACKUP_TABLES)) {
    const rows = json.tables[name] ?? [];
    if (!Array.isArray(rows)) throw new Error(`Backup table "${name}" is malformed.`);
    tables[name] = rows.map((row, i) => {
      if (!isObject(row)) throw new Error(`Backup row ${name}[${i}] is malformed.`);
      for (const [key, value] of Object.entries(row)) {
        if (!spec.columns.includes(key)) {
          throw new Error(`Backup row ${name}[${i}] has unknown field "${key}".`);
        }
        if (value !== null && typeof value !== 'string' && typeof value !== 'number') {
          throw new Error(`Backup row ${name}[${i}].${key} has an invalid value.`);
        }
      }
      for (const column of spec.columns) {
        if (
          !spec.nullable.includes(column) &&
          (row[column] === undefined || row[column] === null)
        ) {
          throw new Error(`Backup row ${name}[${i}] is missing "${column}".`);
        }
      }
      return row as BackupRow;
    });
  }

  let prefs: Backup['prefs'];
  if (isObject(json.prefs) && Array.isArray(json.prefs.dashboardMetrics)) {
    prefs = {
      dashboardMetrics: json.prefs.dashboardMetrics.filter(
        (t): t is string => typeof t === 'string',
      ),
    };
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : '',
    tables,
    prefs,
  };
}
