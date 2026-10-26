import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { cancelReminderNotification, scheduleReminderNotification } from '@/features/reminders/notifications';
import { secureStoreAdapter } from '@/lib/auth/session';
import { getLatestCareEventsByType } from '@/lib/offline/database';
import { dueAt, FeedingReminderSettings, intervalLabel, parseSettings } from './interval';

// Device-local preferences, deliberately not synced or queued (same as
// features/dashboard/preferences.ts). Works offline and in the web demo.
const SETTINGS_KEY = 'preemietrack.feedingReminder';
const NOTIFICATION_KEY = 'preemietrack.feedingReminder.notificationId';

export async function loadFeedingReminderSettings(): Promise<FeedingReminderSettings> {
  return parseSettings(await secureStoreAdapter.getItem(SETTINGS_KEY));
}

export async function saveFeedingReminderSettings(settings: FeedingReminderSettings): Promise<void> {
  await secureStoreAdapter.setItem(SETTINGS_KEY, JSON.stringify(settings));
  await syncFeedingReminder();
}

// Re-derives the single pending notification from the latest non-deleted
// feeding. Call after any feeding save/edit/delete and any settings change.
// ponytail: not unit-tested against real notifications (needs a device); the
// timing logic lives in interval.ts. Upgrade path: inject a notifier.
export async function syncFeedingReminder(): Promise<void> {
  await cancelReminderNotification((await secureStoreAdapter.getItem(NOTIFICATION_KEY)) ?? undefined);
  await secureStoreAdapter.removeItem(NOTIFICATION_KEY);

  const settings = await loadFeedingReminderSettings();
  const latest = (await getLatestCareEventsByType(LOCAL_BABY_ID)).find((e) => e.type === 'feeding');
  const fireAt = dueAt(latest?.occurred_at, settings, new Date());
  if (!fireAt || !settings.intervalMinutes) return;

  // NEEDS-CLINICAL-REVIEW: notification copy.
  const id = await scheduleReminderNotification(
    `It's been ${intervalLabel(settings.intervalMinutes)} since the last feeding`,
    fireAt,
  );
  if (id) await secureStoreAdapter.setItem(NOTIFICATION_KEY, id);
}
