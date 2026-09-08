import * as Crypto from 'expo-crypto';
import {
  deleteReminder as deleteReminderRow,
  getReminder,
  insertReminder,
  listReminders as listReminderRows,
  ReminderRow,
  updateReminder as updateReminderRow,
} from '@/lib/offline/database';
import { cancelReminderNotification, scheduleReminderNotification } from './notifications';
import { nextOccurrence, previousOccurrence } from './schedule';
import { Reminder, ReminderType } from './types';

export type ReminderView = Reminder & { nextFiresAt?: Date; missed: boolean };

function fromRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    babyId: row.baby_id,
    type: row.type as ReminderType,
    title: row.title,
    timeOfDay: row.time_of_day,
    daysOfWeek: JSON.parse(row.days_of_week),
    timezone: row.timezone,
    enabled: row.enabled === 1,
    status: row.status as Reminder['status'],
    snoozedUntil: row.snoozed_until ?? undefined,
    lastCompletedAt: row.last_completed_at ?? undefined,
    notificationId: row.notification_id ?? undefined,
  };
}

// Neutral status only (Section 12) — "missed" is informational, rendered by
// the screen as "Missed — reschedule", never shaming copy.
function toView(reminder: Reminder, now: Date): ReminderView {
  if (!reminder.enabled) return { ...reminder, missed: false };
  if (reminder.status === 'snoozed' && reminder.snoozedUntil) {
    const snoozedUntil = new Date(reminder.snoozedUntil);
    if (snoozedUntil > now) return { ...reminder, nextFiresAt: snoozedUntil, missed: false };
  }
  const next = nextOccurrence(now, reminder.timeOfDay, reminder.daysOfWeek, reminder.timezone);
  const previous = previousOccurrence(now, reminder.timeOfDay, reminder.daysOfWeek, reminder.timezone);
  const lastCompletedAt = reminder.lastCompletedAt ? new Date(reminder.lastCompletedAt) : undefined;
  const missed = Boolean(previous && (!lastCompletedAt || lastCompletedAt < previous));
  return { ...reminder, nextFiresAt: next, missed };
}

export async function loadReminders(babyId: string, now = new Date()): Promise<ReminderView[]> {
  const rows = await listReminderRows(babyId);
  return rows.map((row) => toView(fromRow(row), now));
}

export async function loadReminder(id: string): Promise<ReminderView | undefined> {
  const row = await getReminder(id);
  return row ? toView(fromRow(row), new Date()) : undefined;
}

export type CreateReminderInput = {
  babyId: string;
  type: ReminderType;
  title: string;
  timeOfDay: string;
  daysOfWeek: number[];
  timezone: string;
};

async function rescheduleNotification(
  id: string,
  title: string,
  timeOfDay: string,
  daysOfWeek: number[],
  timezone: string,
  previousNotificationId?: string,
) {
  await cancelReminderNotification(previousNotificationId);
  const fireAt = nextOccurrence(new Date(), timeOfDay, daysOfWeek, timezone);
  const notificationId = fireAt ? await scheduleReminderNotification(title, fireAt) : undefined;
  await updateReminderRow(id, { notificationId: notificationId ?? null });
}

export async function createReminder(input: CreateReminderInput): Promise<string> {
  const id = Crypto.randomUUID();
  await insertReminder({ ...input, id, enabled: true });
  await rescheduleNotification(id, input.title, input.timeOfDay, input.daysOfWeek, input.timezone);
  return id;
}

export async function editReminder(
  id: string,
  patch: Partial<Omit<CreateReminderInput, 'babyId'>>,
): Promise<void> {
  const existing = await getReminder(id);
  if (!existing) throw new Error('Reminder not found');
  await updateReminderRow(id, patch);
  if (patch.title || patch.timeOfDay || patch.daysOfWeek || patch.timezone) {
    await rescheduleNotification(
      id,
      patch.title ?? existing.title,
      patch.timeOfDay ?? existing.time_of_day,
      patch.daysOfWeek ?? JSON.parse(existing.days_of_week),
      patch.timezone ?? existing.timezone,
      existing.notification_id ?? undefined,
    );
  }
}

export async function snoozeReminder(id: string, minutes: number) {
  const existing = await getReminder(id);
  if (!existing) throw new Error('Reminder not found');
  const snoozedUntil = new Date(Date.now() + minutes * 60_000);
  await cancelReminderNotification(existing.notification_id ?? undefined);
  const notificationId = await scheduleReminderNotification(existing.title, snoozedUntil);
  await updateReminderRow(id, {
    status: 'snoozed',
    snoozedUntil: snoozedUntil.toISOString(),
    notificationId: notificationId ?? null,
  });
}

export async function completeReminder(id: string) {
  const existing = await getReminder(id);
  if (!existing) throw new Error('Reminder not found');
  await updateReminderRow(id, {
    status: 'pending',
    snoozedUntil: null,
    lastCompletedAt: new Date().toISOString(),
  });
  await rescheduleNotification(
    id,
    existing.title,
    existing.time_of_day,
    JSON.parse(existing.days_of_week),
    existing.timezone,
    existing.notification_id ?? undefined,
  );
}

export async function removeReminder(id: string) {
  const existing = await getReminder(id);
  await cancelReminderNotification(existing?.notification_id ?? undefined);
  await deleteReminderRow(id);
}
