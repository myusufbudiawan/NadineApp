// Server-side mirror of apps/mobile/lib/age.ts — duplicated rather than
// shared, same pattern already accepted for timezone.ts (Constitution 0.A #1:
// one Expo app + one thin, separate backend service, no shared package).
export type Age = { weeks: number; days: number; totalDays: number };
const DAY = 86_400_000;

function calendarDays(from: Date, to: Date): number {
  return Math.floor(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      DAY,
  );
}

function toSignedAge(totalDays: number): Age {
  const weeks = Math.trunc(totalDays / 7);
  const days = totalDays - weeks * 7;
  return { weeks, days, totalDays };
}

export function actualAge(birthDate: Date, now = new Date()): Age {
  const totalDays = Math.max(0, calendarDays(birthDate, now));
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7, totalDays };
}

/**
 * NEEDS-CLINICAL-REVIEW: reference gestation stays configurable; no clinical
 * threshold is embedded. A negative result means the baby hasn't yet reached
 * its full-term-equivalent due date — do not clamp to zero (Section 8.2).
 */
export function correctedAge(
  birthDate: Date,
  gestationalWeeks: number,
  gestationalDays: number,
  fullTermWeeks: number,
  now = new Date(),
): Age {
  return toSignedAge(
    actualAge(birthDate, now).totalDays -
      (fullTermWeeks * 7 - (gestationalWeeks * 7 + gestationalDays)),
  );
}
