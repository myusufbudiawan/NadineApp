import { Ionicons } from '@expo/vector-icons';
import { ReminderType } from './types';

export const reminderTypeConfig: Record<
  ReminderType,
  { icon: keyof typeof Ionicons.glyphMap; tone: 'violet' | 'blue' | 'pink' | 'gray' }
> = {
  feeding: { icon: 'water-outline', tone: 'violet' },
  medication: { icon: 'medkit-outline', tone: 'blue' },
  measurement: { icon: 'scale-outline', tone: 'pink' },
  general: { icon: 'notifications-outline', tone: 'gray' },
};

export function formatReminderSubtitle(reminder: {
  daysOfWeek: number[];
  timeOfDay: string;
  missed: boolean;
  status: string;
  snoozedUntil?: string;
}): string {
  const days =
    reminder.daysOfWeek.length === 7
      ? 'Every day'
      : reminder.daysOfWeek
          .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
          .join(', ');
  if (reminder.missed) return `Missed — reschedule · ${reminder.timeOfDay}`;
  if (reminder.status === 'snoozed' && reminder.snoozedUntil) {
    const time = new Date(reminder.snoozedUntil).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Snoozed until ${time}`;
  }
  return `${days} · ${reminder.timeOfDay}`;
}
