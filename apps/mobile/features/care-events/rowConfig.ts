import { Ionicons } from '@expo/vector-icons';
import {
  CareEvent,
  CareEventType,
  DiaperData,
  FeedingData,
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
