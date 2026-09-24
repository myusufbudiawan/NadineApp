import { PRETERM_REFERENCE, pretermPercentiles } from './preterm-reference-data';
import { GrowthMetric } from './types';

export type ReferenceAnchor = { months: number; p15: number; p50: number; p85: number };

/**
 * NEEDS-CLINICAL-REVIEW: WHO Child Growth Standards (2006), 0–24 completed
 * months, sex-specific — the 15th/50th/85th percentile columns as published
 * by WHO (https://www.who.int/tools/child-growth-standards), transcribed
 * from the official per-indicator percentile tables (weight-for-age,
 * length-for-age, head-circumference-for-age; "boys"/"girls, birth to 2/5
 * years"). Used from a baby's corrected-age due date onward.
 *
 * Before the due date the band comes from the approximated preterm
 * reference in `./preterm-reference-data.ts` instead (see its caveats), and
 * the two are blended just after it — see `growthReferenceBandAt` below.
 */
export const WHO_REFERENCE_BOYS: Record<'weight' | 'length' | 'headCircumference', ReferenceAnchor[]> = {
  weight: [
    { months: 0, p15: 2.9, p50: 3.3, p85: 3.9 },
    { months: 1, p15: 3.9, p50: 4.5, p85: 5.1 },
    { months: 2, p15: 4.9, p50: 5.6, p85: 6.3 },
    { months: 3, p15: 5.6, p50: 6.4, p85: 7.2 },
    { months: 4, p15: 6.2, p50: 7.0, p85: 7.9 },
    { months: 5, p15: 6.7, p50: 7.5, p85: 8.4 },
    { months: 6, p15: 7.1, p50: 7.9, p85: 8.9 },
    { months: 7, p15: 7.4, p50: 8.3, p85: 9.3 },
    { months: 8, p15: 7.7, p50: 8.6, p85: 9.6 },
    { months: 9, p15: 7.9, p50: 8.9, p85: 10.0 },
    { months: 10, p15: 8.2, p50: 9.2, p85: 10.3 },
    { months: 11, p15: 8.4, p50: 9.4, p85: 10.5 },
    { months: 12, p15: 8.6, p50: 9.6, p85: 10.8 },
    { months: 13, p15: 8.8, p50: 9.9, p85: 11.1 },
    { months: 14, p15: 9.0, p50: 10.1, p85: 11.3 },
    { months: 15, p15: 9.2, p50: 10.3, p85: 11.6 },
    { months: 16, p15: 9.4, p50: 10.5, p85: 11.8 },
    { months: 17, p15: 9.6, p50: 10.7, p85: 12.0 },
    { months: 18, p15: 9.7, p50: 10.9, p85: 12.3 },
    { months: 19, p15: 9.9, p50: 11.1, p85: 12.5 },
    { months: 20, p15: 10.1, p50: 11.3, p85: 12.7 },
    { months: 21, p15: 10.3, p50: 11.5, p85: 13.0 },
    { months: 22, p15: 10.5, p50: 11.8, p85: 13.2 },
    { months: 23, p15: 10.6, p50: 12.0, p85: 13.4 },
    { months: 24, p15: 10.8, p50: 12.2, p85: 13.7 },
  ],
  length: [
    { months: 0, p15: 47.9, p50: 49.9, p85: 51.8 },
    { months: 1, p15: 52.7, p50: 54.7, p85: 56.7 },
    { months: 2, p15: 56.4, p50: 58.4, p85: 60.5 },
    { months: 3, p15: 59.3, p50: 61.4, p85: 63.5 },
    { months: 4, p15: 61.7, p50: 63.9, p85: 66.0 },
    { months: 5, p15: 63.7, p50: 65.9, p85: 68.1 },
    { months: 6, p15: 65.4, p50: 67.6, p85: 69.8 },
    { months: 7, p15: 66.9, p50: 69.2, p85: 71.4 },
    { months: 8, p15: 68.3, p50: 70.6, p85: 72.9 },
    { months: 9, p15: 69.6, p50: 72.0, p85: 74.3 },
    { months: 10, p15: 70.9, p50: 73.3, p85: 75.6 },
    { months: 11, p15: 72.1, p50: 74.5, p85: 77.0 },
    { months: 12, p15: 73.3, p50: 75.7, p85: 78.2 },
    { months: 13, p15: 74.4, p50: 76.9, p85: 79.4 },
    { months: 14, p15: 75.5, p50: 78.0, p85: 80.6 },
    { months: 15, p15: 76.5, p50: 79.1, p85: 81.8 },
    { months: 16, p15: 77.5, p50: 80.2, p85: 82.9 },
    { months: 17, p15: 78.5, p50: 81.2, p85: 84.0 },
    { months: 18, p15: 79.5, p50: 82.3, p85: 85.1 },
    { months: 19, p15: 80.4, p50: 83.2, p85: 86.1 },
    { months: 20, p15: 81.3, p50: 84.2, p85: 87.1 },
    { months: 21, p15: 82.2, p50: 85.1, p85: 88.1 },
    { months: 22, p15: 83.0, p50: 86.0, p85: 89.1 },
    { months: 23, p15: 83.8, p50: 86.9, p85: 90.0 },
    { months: 24, p15: 84.6, p50: 87.8, p85: 91.0 },
  ],
  headCircumference: [
    { months: 0, p15: 33.1, p50: 34.5, p85: 35.8 },
    { months: 1, p15: 36.1, p50: 37.3, p85: 38.5 },
    { months: 2, p15: 37.9, p50: 39.1, p85: 40.3 },
    { months: 3, p15: 39.3, p50: 40.5, p85: 41.7 },
    { months: 4, p15: 40.4, p50: 41.6, p85: 42.9 },
    { months: 5, p15: 41.3, p50: 42.6, p85: 43.8 },
    { months: 6, p15: 42.1, p50: 43.3, p85: 44.6 },
    { months: 7, p15: 42.7, p50: 44.0, p85: 45.3 },
    { months: 8, p15: 43.2, p50: 44.5, p85: 45.8 },
    { months: 9, p15: 43.7, p50: 45.0, p85: 46.3 },
    { months: 10, p15: 44.1, p50: 45.4, p85: 46.7 },
    { months: 11, p15: 44.4, p50: 45.8, p85: 47.1 },
    { months: 12, p15: 44.7, p50: 46.1, p85: 47.4 },
    { months: 13, p15: 45.0, p50: 46.3, p85: 47.7 },
    { months: 14, p15: 45.2, p50: 46.6, p85: 47.9 },
    { months: 15, p15: 45.5, p50: 46.8, p85: 48.2 },
    { months: 16, p15: 45.6, p50: 47.0, p85: 48.4 },
    { months: 17, p15: 45.8, p50: 47.2, p85: 48.6 },
    { months: 18, p15: 46.0, p50: 47.4, p85: 48.7 },
    { months: 19, p15: 46.2, p50: 47.5, p85: 48.9 },
    { months: 20, p15: 46.3, p50: 47.7, p85: 49.1 },
    { months: 21, p15: 46.4, p50: 47.8, p85: 49.2 },
    { months: 22, p15: 46.6, p50: 48.0, p85: 49.4 },
    { months: 23, p15: 46.7, p50: 48.1, p85: 49.5 },
    { months: 24, p15: 46.8, p50: 48.3, p85: 49.7 },
  ],
};

// Same source (WHO Child Growth Standards 2006), girls tables — transcribed
// from wfa-girls-0-5-percentiles.pdf, lfa-girls-0-2-percentiles.pdf, and
// hcfa_girls_0_5_percentiles.pdf on cdn.who.int.
export const WHO_REFERENCE_GIRLS: Record<'weight' | 'length' | 'headCircumference', ReferenceAnchor[]> = {
  weight: [
    { months: 0, p15: 2.8, p50: 3.2, p85: 3.7 },
    { months: 1, p15: 3.6, p50: 4.2, p85: 4.8 },
    { months: 2, p15: 4.5, p50: 5.1, p85: 5.9 },
    { months: 3, p15: 5.1, p50: 5.8, p85: 6.7 },
    { months: 4, p15: 5.6, p50: 6.4, p85: 7.3 },
    { months: 5, p15: 6.1, p50: 6.9, p85: 7.8 },
    { months: 6, p15: 6.4, p50: 7.3, p85: 8.3 },
    { months: 7, p15: 6.7, p50: 7.6, p85: 8.7 },
    { months: 8, p15: 7.0, p50: 7.9, p85: 9.0 },
    { months: 9, p15: 7.3, p50: 8.2, p85: 9.3 },
    { months: 10, p15: 7.5, p50: 8.5, p85: 9.6 },
    { months: 11, p15: 7.7, p50: 8.7, p85: 9.9 },
    { months: 12, p15: 7.9, p50: 8.9, p85: 10.2 },
    { months: 13, p15: 8.1, p50: 9.2, p85: 10.4 },
    { months: 14, p15: 8.3, p50: 9.4, p85: 10.7 },
    { months: 15, p15: 8.5, p50: 9.6, p85: 10.9 },
    { months: 16, p15: 8.7, p50: 9.8, p85: 11.2 },
    { months: 17, p15: 8.8, p50: 10.0, p85: 11.4 },
    { months: 18, p15: 9.0, p50: 10.2, p85: 11.6 },
    { months: 19, p15: 9.2, p50: 10.4, p85: 11.9 },
    { months: 20, p15: 9.4, p50: 10.6, p85: 12.1 },
    { months: 21, p15: 9.6, p50: 10.9, p85: 12.4 },
    { months: 22, p15: 9.8, p50: 11.1, p85: 12.6 },
    { months: 23, p15: 9.9, p50: 11.3, p85: 12.8 },
    { months: 24, p15: 10.1, p50: 11.5, p85: 13.1 },
  ],
  length: [
    { months: 0, p15: 47.2, p50: 49.1, p85: 51.1 },
    { months: 1, p15: 51.7, p50: 53.7, p85: 55.7 },
    { months: 2, p15: 55.0, p50: 57.1, p85: 59.2 },
    { months: 3, p15: 57.6, p50: 59.8, p85: 62.0 },
    { months: 4, p15: 59.8, p50: 62.1, p85: 64.3 },
    { months: 5, p15: 61.7, p50: 64.0, p85: 66.3 },
    { months: 6, p15: 63.4, p50: 65.7, p85: 68.1 },
    { months: 7, p15: 64.9, p50: 67.3, p85: 69.7 },
    { months: 8, p15: 66.3, p50: 68.7, p85: 71.2 },
    { months: 9, p15: 67.6, p50: 70.1, p85: 72.6 },
    { months: 10, p15: 68.9, p50: 71.5, p85: 74.0 },
    { months: 11, p15: 70.2, p50: 72.8, p85: 75.4 },
    { months: 12, p15: 71.3, p50: 74.0, p85: 76.7 },
    { months: 13, p15: 72.5, p50: 75.2, p85: 77.9 },
    { months: 14, p15: 73.6, p50: 76.4, p85: 79.2 },
    { months: 15, p15: 74.7, p50: 77.5, p85: 80.3 },
    { months: 16, p15: 75.7, p50: 78.6, p85: 81.5 },
    { months: 17, p15: 76.7, p50: 79.7, p85: 82.6 },
    { months: 18, p15: 77.7, p50: 80.7, p85: 83.7 },
    { months: 19, p15: 78.7, p50: 81.7, p85: 84.8 },
    { months: 20, p15: 79.6, p50: 82.7, p85: 85.8 },
    { months: 21, p15: 80.5, p50: 83.7, p85: 86.8 },
    { months: 22, p15: 81.4, p50: 84.6, p85: 87.8 },
    { months: 23, p15: 82.2, p50: 85.5, p85: 88.8 },
    { months: 24, p15: 83.1, p50: 86.4, p85: 89.8 },
  ],
  headCircumference: [
    { months: 0, p15: 32.7, p50: 33.9, p85: 35.1 },
    { months: 1, p15: 35.3, p50: 36.5, p85: 37.8 },
    { months: 2, p15: 37.0, p50: 38.3, p85: 39.5 },
    { months: 3, p15: 38.2, p50: 39.5, p85: 40.8 },
    { months: 4, p15: 39.3, p50: 40.6, p85: 41.9 },
    { months: 5, p15: 40.1, p50: 41.5, p85: 42.8 },
    { months: 6, p15: 40.8, p50: 42.2, p85: 43.5 },
    { months: 7, p15: 41.5, p50: 42.8, p85: 44.2 },
    { months: 8, p15: 42.0, p50: 43.4, p85: 44.7 },
    { months: 9, p15: 42.4, p50: 43.8, p85: 45.2 },
    { months: 10, p15: 42.8, p50: 44.2, p85: 45.6 },
    { months: 11, p15: 43.2, p50: 44.6, p85: 46.0 },
    { months: 12, p15: 43.5, p50: 44.9, p85: 46.3 },
    { months: 13, p15: 43.8, p50: 45.2, p85: 46.6 },
    { months: 14, p15: 44.0, p50: 45.4, p85: 46.8 },
    { months: 15, p15: 44.2, p50: 45.7, p85: 47.1 },
    { months: 16, p15: 44.4, p50: 45.9, p85: 47.3 },
    { months: 17, p15: 44.6, p50: 46.1, p85: 47.5 },
    { months: 18, p15: 44.8, p50: 46.2, p85: 47.7 },
    { months: 19, p15: 45.0, p50: 46.4, p85: 47.8 },
    { months: 20, p15: 45.1, p50: 46.6, p85: 48.0 },
    { months: 21, p15: 45.3, p50: 46.7, p85: 48.2 },
    { months: 22, p15: 45.4, p50: 46.9, p85: 48.3 },
    { months: 23, p15: 45.6, p50: 47.0, p85: 48.5 },
    { months: 24, p15: 45.7, p50: 47.2, p85: 48.6 },
  ],
};

const WEEKS_PER_MONTH = 4.348; // 365.25 / 12 / 7 — average calendar month in weeks.
// Fenton's own approach: the preterm curves are smoothed into WHO by 50
// weeks PMA, i.e. ~10 weeks after the due date.
const BLEND_WEEKS_AFTER_DUE = 10;

export type ReferenceBandValue = { low: number; mid: number; high: number };

// Monotone cubic (Fritsch–Carlson) interpolation. Growth curves are smooth
// and concave in early infancy; joining monthly WHO anchors with straight
// lines under-reads them between anchors (by up to ~0.15 kg in the first
// months), while a monotone cubic follows the curve without ever
// overshooting or wiggling between points.
function monotoneCubic(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) slopes.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const tangents = ys.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    const a = slopes[i - 1];
    const b = slopes[i];
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b); // harmonic mean keeps it monotone
  });
  let k = 0;
  while (x > xs[k + 1]) k++;
  const h = xs[k + 1] - xs[k];
  const t = (x - xs[k]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[k] +
    (t3 - 2 * t2 + t) * h * tangents[k] +
    (-2 * t3 + 3 * t2) * ys[k + 1] +
    (t3 - t2) * h * tangents[k + 1]
  );
}

function whoBandAtMonths(metric: GrowthMetric, months: number, sex: 'girl' | 'boy'): ReferenceBandValue {
  const table = (sex === 'girl' ? WHO_REFERENCE_GIRLS : WHO_REFERENCE_BOYS)[metric];
  const xs = table.map((a) => a.months);
  return {
    low: monotoneCubic(xs, table.map((a) => a.p15), months),
    mid: monotoneCubic(xs, table.map((a) => a.p50), months),
    high: monotoneCubic(xs, table.map((a) => a.p85), months),
  };
}

function pretermBandAt(
  metric: GrowthMetric,
  pmaWeeks: number,
  sex: 'girl' | 'boy',
): ReferenceBandValue | undefined {
  const table = PRETERM_REFERENCE[sex][metric];
  if (pmaWeeks < table[0].pmaWeeks) return undefined; // below the earliest viable gestation charted
  const median = monotoneCubic(
    table.map((a) => a.pmaWeeks),
    table.map((a) => a.median),
    pmaWeeks,
  );
  return pretermPercentiles(metric, pmaWeeks, median);
}

// The shaded 15th–85th band at a given corrected age, spanning both sides
// of the due date:
// - before it, the preterm reference (preterm-reference-data.ts) by PMA;
// - after it, WHO — shifted by the preterm/WHO gap at the due date and
//   easing that shift out over the next 10 weeks, so the band is continuous
//   instead of stepping at 0 (the preterm curve, built from babies still
//   growing toward term, sits slightly above WHO's newborn values there).
// Clamps to the last WHO anchor past 24 months rather than extrapolating.
export function growthReferenceBandAt(
  metric: GrowthMetric,
  correctedAgeWeeks: number,
  sex: 'girl' | 'boy',
  fullTermWeeks: number,
): ReferenceBandValue | undefined {
  if (correctedAgeWeeks < 0) {
    return pretermBandAt(metric, fullTermWeeks + correctedAgeWeeks, sex);
  }
  const who = whoBandAtMonths(metric, correctedAgeWeeks / WEEKS_PER_MONTH, sex);
  const atDue = pretermBandAt(metric, fullTermWeeks, sex);
  const fade = Math.max(0, 1 - correctedAgeWeeks / BLEND_WEEKS_AFTER_DUE);
  if (!atDue || fade === 0) return who;
  const whoAtDue = whoBandAtMonths(metric, 0, sex);
  return {
    low: who.low + (atDue.low - whoAtDue.low) * fade,
    mid: who.mid + (atDue.mid - whoAtDue.mid) * fade,
    high: who.high + (atDue.high - whoAtDue.high) * fade,
  };
}
