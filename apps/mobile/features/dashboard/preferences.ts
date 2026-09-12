import { secureStoreAdapter } from '@/lib/auth/session';
import { CareEventType } from '@/features/care-events/types';

// The set of care event types the home screen's 4 "tracking box" metric
// cards can show. Kept separate from `careEventRows` (Section: Track tab)
// because not every event type has a same-day rollup in `todaySummary.ts` —
// only these have one, so only these are offerable here.
export const dashboardMetricTypes: CareEventType[] = [
  'weight',
  'feeding',
  'sleep',
  'diaper',
  'kangaroo',
];

export const DASHBOARD_TILE_COUNT = 4;

export const defaultDashboardMetrics: CareEventType[] = [
  'weight',
  'feeding',
  'sleep',
  'diaper',
];

// Client-only preference (Section: dashboard customization) — deliberately
// not synced to the server or queued as a mutation, so it stays local to
// this device.
const KEY = 'preemietrack.dashboardMetrics';

export async function loadDashboardMetrics(): Promise<CareEventType[]> {
  const raw = await secureStoreAdapter.getItem(KEY);
  if (!raw) return defaultDashboardMetrics;
  try {
    const parsed = JSON.parse(raw) as CareEventType[];
    const valid = parsed.filter((t) => dashboardMetricTypes.includes(t));
    return valid.length === DASHBOARD_TILE_COUNT ? valid : defaultDashboardMetrics;
  } catch {
    return defaultDashboardMetrics;
  }
}

export async function saveDashboardMetrics(types: CareEventType[]): Promise<void> {
  await secureStoreAdapter.setItem(KEY, JSON.stringify(types));
}
