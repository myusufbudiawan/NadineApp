// Mirrors services/api/src/common/util/timezone.ts — kept separate rather
// than shared across the client/server boundary (no shared package exists
// yet, Constitution 0.A #1 keeps client and server clearly separated), but
// the DST-correctness approach must stay identical: resolve the offset via
// Intl.DateTimeFormat for the specific date in question, never a fixed
// UTC-offset assumption.

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

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

function dateInZone(instant: Date, timeZone: string): { dateISO: string; dow: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return { dateISO: `${parts.year}-${parts.month}-${parts.day}`, dow: WEEKDAY_INDEX[parts.weekday] };
}

function zonedTimeToUtc(dateISO: string, timeOfDay: string, timeZone: string): Date {
  const naiveUtc = new Date(`${dateISO}T${timeOfDay}:00.000Z`);
  const offset = offsetMinutesAt(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offset * 60_000);
}

export function nextOccurrence(
  now: Date,
  timeOfDay: string,
  daysOfWeek: number[],
  timeZone: string,
): Date | undefined {
  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const probe = new Date(now.getTime() + dayOffset * 86_400_000);
    const { dateISO, dow } = dateInZone(probe, timeZone);
    if (!daysOfWeek.includes(dow)) continue;
    const candidate = zonedTimeToUtc(dateISO, timeOfDay, timeZone);
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  return undefined;
}

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
