export type Age = { weeks: number; days: number; totalDays: number };
const DAY = 86_400_000;
function calendarDays(from: Date, to: Date): number {
  return Math.floor(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      DAY,
  );
}
export function toAge(totalDays: number): Age {
  const safe = Math.max(0, totalDays);
  return { weeks: Math.floor(safe / 7), days: safe % 7, totalDays: safe };
}
// Same breakdown as toAge but keeps the sign instead of clamping to zero —
// corrected age needs this (see correctedAge below); actual age never does,
// since a baby can't have a future birth date (validated at entry).
function toSignedAge(totalDays: number): Age {
  const weeks = Math.trunc(totalDays / 7);
  const days = totalDays - weeks * 7;
  return { weeks, days, totalDays };
}
export function actualAge(birthDate: Date, now = new Date()): Age {
  return toAge(calendarDays(birthDate, now));
}
/**
 * NEEDS-CLINICAL-REVIEW: reference gestation stays configurable; no clinical
 * threshold is embedded.
 *
 * A negative result is expected and clinically normal: it means the baby
 * hasn't yet reached its full-term-equivalent due date (Section 8.2). Do not
 * clamp this to zero — collapsing every preterm reading to day zero would
 * make longitudinal growth data meaningless for the babies this app is for.
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
export function formatAge(age: Age) {
  const totalAbs = Math.abs(age.totalDays);
  const weeks = Math.floor(totalAbs / 7);
  const days = totalAbs % 7;
  return weeks ? `${weeks}w ${days}d` : `${days} days`;
}
// "6 days (0w 6d)" / "12 days before due date (1w 5d)" — the parenthetical
// week/day breakdown callers already show next to a plain day count.
export function formatAgeDetailed(age: Age) {
  const totalAbs = Math.abs(age.totalDays);
  const weeks = Math.floor(totalAbs / 7);
  const days = totalAbs % 7;
  const base = `${totalAbs} days (${weeks}w ${days}d)`;
  return age.totalDays < 0 ? `${base} before due date` : base;
}
