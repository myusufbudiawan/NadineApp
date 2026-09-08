import { GrowthMetric, GrowthUnit } from './types';

// NEEDS-CLINICAL-REVIEW: plausibility bounds below are engineering placeholders
// to reject impossible entries (Section 8.3), not clinically approved thresholds.
export function validateGrowthMeasurement(
  metric: GrowthMetric,
  value: number,
  unit: GrowthUnit,
): string | undefined {
  if (!(value > 0)) return 'Value must be greater than 0';
  const max =
    metric === 'weight'
      ? unit === 'kg'
        ? 25
        : 55
      : metric === 'length'
        ? unit === 'cm'
          ? 120
          : 47
        : unit === 'cm'
          ? 60
          : 24;
  if (value > max) return 'Value is outside the expected range';
  return undefined;
}
