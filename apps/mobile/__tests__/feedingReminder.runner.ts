import { strict as assert } from 'node:assert';
import { dueAt, intervalLabel, parseSettings } from '../features/feeding-reminder/interval.ts';

// Anything missing, corrupt or not a known preset reads as "not configured".
assert.deepEqual(parseSettings(null), { enabled: false });
assert.deepEqual(parseSettings('not json'), { enabled: false });
assert.deepEqual(parseSettings('{"enabled":true,"intervalMinutes":45}'), { enabled: false });
assert.deepEqual(parseSettings('{"enabled":true}'), { enabled: true });
assert.deepEqual(
  parseSettings('{"enabled":true,"intervalMinutes":180}'),
  { enabled: true, intervalMinutes: 180 },
);

assert.equal(intervalLabel(180), '3 hours');
assert.equal(intervalLabel(150), '2.5 hours');

const last = '2026-01-01T10:00:00.000Z';
const on = { enabled: true, intervalMinutes: 180 };
const now = new Date('2026-01-01T11:00:00.000Z');
assert.equal(dueAt(last, on, now)?.toISOString(), '2026-01-01T13:00:00.000Z');
// Already past due (e.g. an old backdated feeding): nothing to schedule.
assert.equal(dueAt(last, on, new Date('2026-01-01T14:00:00.000Z')), undefined);
assert.equal(dueAt(last, { enabled: false, intervalMinutes: 180 }, now), undefined);
assert.equal(dueAt(last, { enabled: true }, now), undefined);
assert.equal(dueAt(undefined, on, now), undefined);

console.log('Feeding reminder tests passed.');
