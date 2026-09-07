// No date library is in the dependency tree (Section 0.A #3 favors a thin
// stack), so DST-correct scheduling is done with Intl.DateTimeFormat instead
// of a fixed UTC-offset assumption — a fixed offset would fire reminders an
// hour off for half the year in any timezone that observes DST.

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Date parts (YYYY-MM-DD) and weekday index (0=Sun) for a UTC instant, as seen in `timeZone`. */
export function dateInZone(instant: Date, timeZone: string): { dateISO: string; dow: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((p) => [p.type, p.value]),
  );
  return {
    dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    dow: WEEKDAY_INDEX[parts.weekday],
  };
}

// Minutes to ADD to a UTC instant to get that zone's local wall-clock time —
// computed via Intl rather than Date#getTimezoneOffset (which only knows the
// *system's* zone). Deliberately independent of the host machine's timezone,
// since this runs on a server that may not be in any caregiver's timezone.
function offsetMinutesAt(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - instant.getTime()) / 60_000;
}

/**
 * Resolves a wall-clock "HH:MM" on a given calendar date, in a given IANA
 * timezone, to the UTC instant it corresponds to — accounting for whatever
 * DST offset applies on that specific date (not just today's offset).
 */
export function zonedTimeToUtc(dateISO: string, timeOfDay: string, timeZone: string): Date {
  const naiveUtc = new Date(`${dateISO}T${timeOfDay}:00.000Z`);
  // One correction pass is enough outside the ~1hr-wide DST-transition
  // window itself; reminder scheduling doesn't need sub-transition precision.
  const offset = offsetMinutesAt(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offset * 60_000);
}

/**
 * Next UTC instant, strictly after `now`, on which `timeOfDay` occurs in
 * `timeZone` on one of `daysOfWeek` (0=Sun..6=Sat).
 */
export function nextOccurrence(
  now: Date,
  timeOfDay: string,
  daysOfWeek: number[],
  timeZone: string,
): Date {
  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const probe = new Date(now.getTime() + dayOffset * 86_400_000);
    const { dateISO, dow } = dateInZone(probe, timeZone);
    if (!daysOfWeek.includes(dow)) continue;
    const candidate = zonedTimeToUtc(dateISO, timeOfDay, timeZone);
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  throw new Error('No matching day of week configured for this reminder');
}

/**
 * Most recent UTC instant, at or before `now`, on which `timeOfDay` occurred
 * in `timeZone` on one of `daysOfWeek`. Used to detect a missed reminder.
 */
export function previousOccurrence(
  now: Date,
  timeOfDay: string,
  daysOfWeek: number[],
  timeZone: string,
): Date | undefined {
  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const probe = new Date(now.getTime() - dayOffset * 86_400_000);
    const { dateISO, dow } = dateInZone(probe, timeZone);
    if (!daysOfWeek.includes(dow)) continue;
    const candidate = zonedTimeToUtc(dateISO, timeOfDay, timeZone);
    if (candidate.getTime() <= now.getTime()) return candidate;
  }
  return undefined;
}
