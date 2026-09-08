// Exact set pending Open Product Decision #8 — kept extensible rather than
// hard-coded to today's guess.
export const reminderTypes = ['feeding', 'medication', 'measurement', 'general'] as const;
export type ReminderType = (typeof reminderTypes)[number];

export const reminderTypeLabels: Record<ReminderType, string> = {
  feeding: 'Feeding',
  medication: 'Medication',
  measurement: 'Measurement',
  general: 'General',
};

export type ReminderStatus = 'pending' | 'snoozed' | 'completed';

export type Reminder = {
  id: string;
  babyId: string;
  type: ReminderType;
  title: string;
  timeOfDay: string; // "HH:MM", local wall-clock
  daysOfWeek: number[]; // 0=Sun..6=Sat
  timezone: string;
  enabled: boolean;
  status: ReminderStatus;
  snoozedUntil?: string;
  lastCompletedAt?: string;
  notificationId?: string;
};

export const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
