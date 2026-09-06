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
export function actualAge(birthDate: Date, now = new Date()): Age {
  return toAge(calendarDays(birthDate, now));
}
/** NEEDS-CLINICAL-REVIEW: reference gestation stays configurable; no clinical threshold is embedded. */
export function correctedAge(
  birthDate: Date,
  gestationalWeeks: number,
  gestationalDays: number,
  fullTermWeeks: number,
  now = new Date(),
): Age {
  return toAge(
    actualAge(birthDate, now).totalDays -
      (fullTermWeeks * 7 - (gestationalWeeks * 7 + gestationalDays)),
  );
}
export function formatAge(age: Age) {
  return age.weeks ? `${age.weeks}w ${age.days}d` : `${age.days} days`;
}
