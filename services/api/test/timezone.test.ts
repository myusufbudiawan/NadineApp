import { describe, expect, it } from 'vitest';
import { nextOccurrence } from '../src/common/util/timezone.js';

// America/New_York springs forward on 2027-03-14 at 02:00 local (clocks jump
// to 03:00, UTC offset moves from -05:00 to -04:00). A naive fixed-UTC-offset
// scheduler would fire a 09:00-local daily reminder an hour off for anyone in
// a DST-observing zone after this date; this test pins the exact UTC instant
// on each side of the transition to prove the offset shift is honored.
describe('nextOccurrence (DST)', () => {
  it('resolves 09:00 America/New_York correctly before and after the spring-forward transition', () => {
    const dailyAt9 = { timeOfDay: '09:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] };

    const beforeTransition = new Date('2027-03-12T20:00:00.000Z'); // 2027-03-12 15:00 EST
    const nextBefore = nextOccurrence(
      beforeTransition,
      dailyAt9.timeOfDay,
      dailyAt9.daysOfWeek,
      'America/New_York',
    );
    // 09:00 EST on 2027-03-13 (day before the transition) = 14:00 UTC (offset -05:00).
    expect(nextBefore.toISOString()).toBe('2027-03-13T14:00:00.000Z');

    const afterTransition = new Date('2027-03-13T15:00:00.000Z'); // just after that occurrence
    const nextAfter = nextOccurrence(
      afterTransition,
      dailyAt9.timeOfDay,
      dailyAt9.daysOfWeek,
      'America/New_York',
    );
    // 09:00 on 2027-03-14 — the spring-forward date itself — falls after that
    // day's 02:00 transition, so it's already EDT: 13:00 UTC (offset -04:00).
    // The one-hour shift versus the previous occurrence is the DST correction.
    expect(nextAfter.toISOString()).toBe('2027-03-14T13:00:00.000Z');
  });

  it('skips days not in daysOfWeek', () => {
    // 2026-09-07 is a Monday; querying from just after that day's 09:00
    // occurrence should roll over to the following Monday, not fire same-day.
    const mondayOnly = nextOccurrence(
      new Date('2026-09-07T10:00:00.000Z'),
      '09:00',
      [1],
      'UTC',
    );
    expect(mondayOnly.toISOString()).toBe('2026-09-14T09:00:00.000Z');
  });
});
