import { Ionicons } from '@expo/vector-icons';
import { CareEventType } from '@/features/care-events/types';
import { TodaySummary } from '@/features/care-events/todaySummary';

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export type DashboardMetricView = {
  type: CareEventType;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'pink' | 'violet' | 'blue' | 'yellow';
  title: string;
  value: string;
  unit?: string;
  caption: string;
  route: string;
};

// Turns a `TodaySummary` slice into the props `MetricCard` needs, for
// whichever 4 types the user picked on the customize-dashboard screen
// (Section: dashboard customization). Keep in sync with `dashboardMetricTypes`
// in `preferences.ts` — every offerable type needs a case here.
export function getDashboardMetricView(
  type: CareEventType,
  summary: TodaySummary | undefined,
): DashboardMetricView {
  switch (type) {
    case 'weight':
      return {
        type,
        icon: 'scale-outline',
        tone: 'pink',
        title: 'Weight',
        value: summary?.weight.hasAny ? String(summary.weight.value) : '—',
        unit: summary?.weight.hasAny ? summary?.weight.unit : undefined,
        caption: summary?.weight.hasAny ? summary!.weight.deltaCaption! : 'No weight logged yet',
        route: '/track/add-weight',
      };
    case 'feeding':
      return {
        type,
        icon: 'water-outline',
        tone: 'violet',
        title: 'Feeding',
        value: summary?.feeding.hasAny ? String(summary.feeding.lastAmount ?? '—') : '—',
        unit: summary?.feeding.hasAny ? summary?.feeding.lastUnit : undefined,
        caption: summary?.feeding.hasAny
          ? `${summary.feeding.todayCount} feeds today`
          : 'No feeding logged yet',
        route: '/track/add-feeding',
      };
    case 'sleep':
      return {
        type,
        icon: 'moon-outline',
        tone: 'blue',
        title: 'Sleep',
        value: summary?.sleep.hasAny ? formatDuration(summary.sleep.todayTotalMinutes) : '—',
        caption: summary?.sleep.hasAny ? 'Total sleep today' : 'No sleep logged yet',
        route: '/track/add-sleep',
      };
    case 'diaper':
      return {
        type,
        icon: 'happy-outline',
        tone: 'yellow',
        title: 'Diaper',
        value: summary?.diaper.hasAny ? String(summary.diaper.todayCount) : '—',
        caption: summary?.diaper.hasAny
          ? `Wet ${summary.diaper.wet} / Dirty ${summary.diaper.dirty}`
          : 'No diaper logged yet',
        route: '/track/add-diaper',
      };
    case 'kangaroo':
      return {
        type,
        icon: 'heart-outline',
        tone: 'pink',
        title: 'Kangaroo Care',
        value: summary?.kangaroo.hasAny ? formatDuration(summary.kangaroo.todayTotalMinutes) : '—',
        caption: summary?.kangaroo.hasAny
          ? 'Total kangaroo care today'
          : 'No kangaroo care logged yet',
        route: '/track/add-kangaroo',
      };
    default:
      throw new Error(`No dashboard metric view for type ${type}`);
  }
}
