import { GrowthMetric } from './types';

/**
 * NEEDS-CLINICAL-REVIEW: preterm (before-due-date) reference, 22–40 weeks
 * postmenstrual age (PMA), sex-specific.
 *
 * The Fenton 2013 preterm growth chart's exact LMS tables are proprietary,
 * so this is a best-effort approximation of its published curves: weekly
 * 50th-percentile values read off the chart, with the 15th/85th derived from
 * a spread that narrows toward term (weight is right-skewed, so its spread
 * is log-normal; length and head circumference are close to normal). It
 * matches the shape and position of the chart NICUs plot on to within a few
 * percent — good enough for a soft background band, not for clinical
 * percentile calls.
 */
export type PretermAnchor = { pmaWeeks: number; median: number };

const PMA_START = 22;
const series = (medians: number[]): PretermAnchor[] =>
  medians.map((median, i) => ({ pmaWeeks: PMA_START + i, median }));

// 22 → 40 weeks PMA, one value per week.
export const PRETERM_REFERENCE: Record<'boy' | 'girl', Record<GrowthMetric, PretermAnchor[]>> = {
  boy: {
    weight: series([
      0.5, 0.58, 0.67, 0.77, 0.88, 1.0, 1.13, 1.28, 1.44, 1.62, 1.81, 2.02, 2.24, 2.47, 2.71, 2.95,
      3.18, 3.39, 3.57,
    ]),
    length: series([
      28.3, 29.8, 31.3, 32.8, 34.3, 35.7, 37.1, 38.4, 39.7, 41.0, 42.3, 43.5, 44.7, 45.9, 47.0,
      48.1, 49.1, 50.0, 50.8,
    ]),
    headCircumference: series([
      19.8, 20.8, 21.8, 22.8, 23.8, 24.8, 25.8, 26.7, 27.6, 28.5, 29.4, 30.3, 31.1, 31.9, 32.7,
      33.4, 34.0, 34.5, 35.0,
    ]),
  },
  girl: {
    weight: series([
      0.47, 0.54, 0.62, 0.72, 0.82, 0.93, 1.06, 1.2, 1.36, 1.53, 1.72, 1.92, 2.14, 2.37, 2.6, 2.84,
      3.06, 3.27, 3.44,
    ]),
    length: series([
      27.7, 29.2, 30.7, 32.2, 33.7, 35.1, 36.5, 37.8, 39.1, 40.4, 41.7, 42.9, 44.1, 45.3, 46.4,
      47.5, 48.5, 49.4, 50.2,
    ]),
    headCircumference: series([
      19.4, 20.4, 21.4, 22.4, 23.4, 24.3, 25.3, 26.2, 27.1, 28.0, 28.9, 29.8, 30.6, 31.4, 32.2,
      32.9, 33.5, 34.0, 34.5,
    ]),
  },
};

const Z_85 = 1.0364; // standard-normal z-score of the 85th percentile

// Relative spread (log-SD for weight, coefficient of variation otherwise) at
// ≤32 weeks and at 40 weeks, linearly narrowing in between — preterm size
// varies more the earlier the gestation.
const SPREAD: Record<GrowthMetric, { early: number; term: number }> = {
  weight: { early: 0.16, term: 0.13 },
  length: { early: 0.055, term: 0.042 },
  headCircumference: { early: 0.05, term: 0.037 },
};

export function pretermPercentiles(metric: GrowthMetric, pmaWeeks: number, median: number) {
  const t = Math.min(1, Math.max(0, (pmaWeeks - 32) / 8));
  const spread = SPREAD[metric].early + (SPREAD[metric].term - SPREAD[metric].early) * t;
  if (metric === 'weight') {
    return {
      low: median * Math.exp(-Z_85 * spread),
      mid: median,
      high: median * Math.exp(Z_85 * spread),
    };
  }
  return {
    low: median * (1 - Z_85 * spread),
    mid: median,
    high: median * (1 + Z_85 * spread),
  };
}
