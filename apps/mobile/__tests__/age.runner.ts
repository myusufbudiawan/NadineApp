import { strict as assert } from 'node:assert';
import { actualAge, correctedAge } from '../lib/age.ts';

assert.deepEqual(
  actualAge(new Date('2024-02-28T10:00:00Z'), new Date('2024-03-07T10:00:00Z')),
  { weeks: 1, days: 1, totalDays: 8 },
);
assert.deepEqual(
  correctedAge(new Date('2025-01-01'), 32, 3, 40, new Date('2025-02-27')),
  { weeks: 0, days: 4, totalDays: 4 },
);
assert.equal(
  correctedAge(new Date('2025-01-01'), 24, 0, 40, new Date('2025-01-03'))
    .totalDays,
  0,
);
console.log('Age calculation tests passed.');
