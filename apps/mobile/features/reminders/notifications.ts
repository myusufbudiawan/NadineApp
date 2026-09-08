import { Platform } from 'react-native';

// Local + push notification delivery via the Expo Notifications abstraction
// over APNs/FCM (Section 0.1 / Phase 3.3). Reminders only ever schedule
// *local* notifications for now — no push infrastructure (device tokens,
// server-side dispatch) exists yet, which is fine for on-device reminders
// but is a gap for anything that needs to notify while the app was never
// opened on this install (flagged in the task tracker).
//
// `expo-notifications` is lazy-loaded behind a try/catch rather than
// imported at module scope: as of Expo SDK 53, merely *importing* it on
// Android inside Expo Go throws synchronously (its push-token
// auto-registration runs as an import-time side effect, and Expo Go no
// longer supports Android remote push) — an uncaught error that crashed
// every screen that transitively imported this file. A `require()` behind
// try/catch lets a module-load failure degrade to "no local notification
// scheduled" instead of crashing reminder logging entirely (Section 16 — no
// error here may block core tracking). A development build (not Expo Go)
// doesn't hit this at all.
type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;
let handlerInstalled = false;

function loadNotifications(): NotificationsModule | undefined {
  if (cached !== undefined) return cached ?? undefined;
  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('expo-notifications unavailable — reminders will save without a device notification.', error);
    cached = null;
  }
  if (cached && !handlerInstalled) {
    handlerInstalled = true;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return cached ?? undefined;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Copy pass (Phase 3.3): concise, calm, never alarming — a reminder is a
// gentle nudge, not an alert.
export async function scheduleReminderNotification(
  title: string,
  fireAt: Date,
): Promise<string | undefined> {
  const Notifications = loadNotifications();
  if (!Notifications) return undefined;
  const granted = await ensureNotificationPermission();
  if (!granted) return undefined;
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: 'A gentle reminder from PreemieTrack.',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
  });
}

export async function cancelReminderNotification(notificationId?: string) {
  if (!notificationId) return;
  const Notifications = loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const Notifications = loadNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}
