import { correctedAge } from '@/lib/age';
import { BabyProfile } from '@/features/baby-profile/types';
import { GrowthChartPoint } from '@/components/domain/GrowthChart';
import { GrowthMeasurement } from './types';

export type GrowthStats = {
  chartPoints: GrowthChartPoint[];
  latest?: { value: number; unit: string };
  deltaVsPreviousCaption?: string;
  delta7dCaption?: string;
};

const WEEK_MS = 7 * 86_400_000;

// Plots each reading at the corrected age it was taken at, not "now" — a
// measurement from two weeks ago belongs at that day's corrected age, not
// today's (Section 8.2: corrected age is a point-in-time calculation).
export function computeGrowthStats(
  measurements: GrowthMeasurement[],
  profile: BabyProfile,
): GrowthStats {
  const birthDate = new Date(profile.dateOfBirth);
  const chartPoints: GrowthChartPoint[] = measurements.map((m) => {
    const age = correctedAge(
      birthDate,
      profile.gestationalWeeks,
      profile.gestationalDays,
      profile.fullTermReferenceWeeks,
      new Date(m.measuredAt),
    );
    return { ageWeeks: age.totalDays / 7, value: m.value };
  });

  if (measurements.length === 0) return { chartPoints };

  const latestMeasurement = measurements[measurements.length - 1];
  const latest = { value: latestMeasurement.value, unit: latestMeasurement.unit };

  let deltaVsPreviousCaption: string | undefined;
  const previous = measurements[measurements.length - 2];
  if (previous && previous.unit === latestMeasurement.unit) {
    const delta = latestMeasurement.value - previous.value;
    const sign = delta >= 0 ? '+' : '';
    deltaVsPreviousCaption = `${sign}${delta.toFixed(2)} ${latestMeasurement.unit} vs previous reading`;
  }

  let delta7dCaption: string | undefined;
  const latestTime = new Date(latestMeasurement.measuredAt).getTime();
  const weekAgoTarget = latestTime - WEEK_MS;
  const priorToAWeekAgo = [...measurements]
    .filter((m) => new Date(m.measuredAt).getTime() <= weekAgoTarget)
    .pop();
  if (priorToAWeekAgo && priorToAWeekAgo.unit === latestMeasurement.unit) {
    const delta = latestMeasurement.value - priorToAWeekAgo.value;
    const sign = delta >= 0 ? '+' : '';
    delta7dCaption = `${sign}${delta.toFixed(2)} ${latestMeasurement.unit} vs last 7 days`;
  }

  return { chartPoints, latest, deltaVsPreviousCaption, delta7dCaption };
}
