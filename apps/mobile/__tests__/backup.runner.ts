import { strict as assert } from 'node:assert';
import { validateBackup } from '../lib/offline/backupFormat.ts';

const ok = {
  app: 'preemietrack',
  version: 1,
  exportedAt: '2026-09-25T00:00:00.000Z',
  tables: {
    baby_profiles: [{ id: 'local-baby', payload: '{}', updated_at: '2026-09-25' }],
    care_events: [
      {
        id: 'e1', baby_id: 'local-baby', type: 'feeding', occurred_at: '2026-09-25',
        data: '{}', notes: null, created_at: '2026-09-25', updated_at: '2026-09-25',
        deleted_at: null, server_updated_at: null,
      },
    ],
  },
  prefs: { dashboardMetrics: ['weight', 'feeding', 'sleep', 'diaper', 42] },
};

// A minimal valid backup parses; missing tables default to empty; junk prefs are dropped.
const parsed = validateBackup(ok);
assert.equal(parsed.tables.care_events.length, 1);
assert.deepEqual(parsed.tables.reminders, []);
assert.deepEqual(parsed.prefs?.dashboardMetrics, ['weight', 'feeding', 'sleep', 'diaper']);

const rejects = (json: unknown, pattern: RegExp) => assert.throws(() => validateBackup(json), pattern);
rejects(null, /isn't a PreemieTrack backup/);
rejects({ ...ok, app: 'other' }, /isn't a PreemieTrack backup/);
rejects({ ...ok, version: 2 }, /different version/);
rejects({ ...ok, tables: [] }, /missing its data/);
rejects({ ...ok, tables: { care_events: {} } }, /malformed/);
// Unknown column: never let a key from the file reach an INSERT.
rejects(
  { ...ok, tables: { baby_profiles: [{ ...ok.tables.baby_profiles[0], 'id) VALUES': 'x' }] } },
  /unknown field/,
);
rejects({ ...ok, tables: { baby_profiles: [{ id: 'x', payload: '{}' }] } }, /missing "updated_at"/);
rejects(
  { ...ok, tables: { baby_profiles: [{ ...ok.tables.baby_profiles[0], payload: { a: 1 } }] } },
  /invalid value/,
);

console.log('backup: all assertions passed');
