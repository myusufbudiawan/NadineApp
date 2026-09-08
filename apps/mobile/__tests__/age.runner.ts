import { strict as assert } from 'node:assert';
import { actualAge, correctedAge, formatAge, formatAgeDetailed } from '../lib/age';

assert.deepEqual(
  actualAge(new Date('2024-02-28T10:00:00Z'), new Date('2024-03-07T10:00:00Z')),
  { weeks: 1, days: 1, totalDays: 8 },
);
assert.deepEqual(
  correctedAge(new Date('2025-01-01'), 32, 3, 40, new Date('2025-02-27')),
  { weeks: 0, days: 4, totalDays: 4 },
);
// Extremely preterm baby, checked well before its full-term-equivalent due
// date: corrected age must stay negative, not clamp to zero (Section 8.2) —
// clamping would collapse every early growth reading onto day zero.
assert.deepEqual(
  correctedAge(new Date('2025-01-01'), 24, 0, 40, new Date('2025-01-03')),
  { weeks: -15, days: -5, totalDays: -110 },
);
assert.equal(formatAge({ weeks: -15, days: -5, totalDays: -110 }), '15w 5d');
assert.equal(
  formatAgeDetailed({ weeks: -15, days: -5, totalDays: -110 }),
  '110 days (15w 5d) before due date',
);
assert.equal(
  formatAgeDetailed({ weeks: 0, days: 4, totalDays: 4 }),
  '4 days (0w 4d)',
);
console.log('Age calculation tests passed.');
