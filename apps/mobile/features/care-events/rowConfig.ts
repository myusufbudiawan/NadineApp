import { Ionicons } from '@expo/vector-icons';
import {
  CareEvent,
  CareEventType,
  DiaperData,
  FeedingData,
  KangarooCareData,
  MedicationData,
  SleepData,
  TemperatureData,
  WeightData,
} from './types';

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(startAt: string, endAt: string) {
  const minutes = Math.round(
    (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000,
  );
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export type CareEventDayGroup = { label: string; events: CareEvent[] };

// History screens read chronologically-descending event lists (Section 1.10)
// and group them by calendar day so a long history stays scannable.
export function groupEventsByDay(events: CareEvent[]): CareEventDayGroup[] {
  const groups: CareEventDayGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const event of events) {
    const date = new Date(event.occurredAt);
    const key = date.toDateString();
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = groups.length;
      indexByKey.set(key, index);
      groups.push({ label: formatDayLabel(date), events: [] });
    }
    groups[index].events.push(event);
  }
  return groups;
}

export type CareEventRowConfig = {
  type: CareEventType;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'pink' | 'violet' | 'blue' | 'yellow' | 'orange';
  title: string;
  route: string;
  historyRoute: string;
  emptyLabel: string;
  format: (event: CareEvent) => string;
};

export const careEventRows: CareEventRowConfig[] = [
  {
    type: 'feeding',
    icon: 'water-outline',
    tone: 'violet',
    title: 'Feeding',
    route: '/track/add-feeding',
    historyRoute: '/track/history/feeding',
    emptyLabel: 'No feeding logged yet',
    format: (e) => {
      const d = e.data as FeedingData;
      return `Last: ${d.amount} ${d.unit} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'weight',
    icon: 'scale-outline',
    tone: 'pink',
    title: 'Weight',
    route: '/track/add-weight',
    historyRoute: '/track/history/weight',
    emptyLabel: 'No weight logged yet',
    format: (e) => {
      const d = e.data as WeightData;
      return `Last: ${d.value} ${d.unit} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'diaper',
    icon: 'happy-outline',
    tone: 'yellow',
    title: 'Diaper',
    route: '/track/add-diaper',
    historyRoute: '/track/history/diaper',
    emptyLabel: 'No diaper logged yet',
    format: (e) => {
      const d = e.data as DiaperData;
      return `Last: ${d.diaperType} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'sleep',
    icon: 'moon-outline',
    tone: 'blue',
    title: 'Sleep',
    route: '/track/add-sleep',
    historyRoute: '/track/history/sleep',
    emptyLabel: 'No sleep logged yet',
    format: (e) => {
      const d = e.data as SleepData;
      return `Last: ${formatDuration(d.startAt, d.endAt)} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'kangaroo',
    icon: 'heart-outline',
    tone: 'pink',
    title: 'Kangaroo Care',
    route: '/track/add-kangaroo',
    historyRoute: '/track/history/kangaroo',
    emptyLabel: 'No kangaroo care logged yet',
    format: (e) => {
      const d = e.data as KangarooCareData;
      return `Last: ${formatDuration(d.startAt, d.endAt)} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'temperature',
    icon: 'thermometer-outline',
    tone: 'orange',
    title: 'Temperature',
    route: '/track/add-temperature',
    historyRoute: '/track/history/temperature',
    emptyLabel: 'No temperature logged yet',
    format: (e) => {
      const d = e.data as TemperatureData;
      return `Last: ${d.value}°${d.unit} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'medication',
    icon: 'medkit-outline',
    tone: 'blue',
    title: 'Medications',
    route: '/track/add-medication',
    historyRoute: '/track/history/medication',
    emptyLabel: 'No meds scheduled',
    format: (e) => {
      const d = e.data as MedicationData;
      return `Last: ${d.medicationName} · ${formatTime(e.occurredAt)}`;
    },
  },
  {
    type: 'note',
    icon: 'document-text-outline',
    tone: 'yellow',
    title: 'Notes',
    route: '/track/add-note',
    historyRoute: '/track/history/note',
    emptyLabel: 'Add a note',
    format: (e) => `Last: ${formatTime(e.occurredAt)}`,
  },
];
