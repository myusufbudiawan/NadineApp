// `expo-notifications` is lazy-loaded behind a try/catch rather than
// imported at module scope: as of Expo SDK 53, merely *importing* it on
// Android inside Expo Go throws synchronously (its push-token
// auto-registration runs as an import-time side effect, and Expo Go no
// longer supports Android remote push). See features/reminders/notifications.ts
// for the same pattern. A development build (not Expo Go) doesn't hit this.
type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

function loadNotifications(): NotificationsModule | undefined {
  if (cached !== undefined) return cached ?? undefined;
  try {
    cached = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('expo-notifications unavailable in this runtime.', error);
    cached = null;
  }
  return cached ?? undefined;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface NotificationService {
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  requestPermission(): Promise<boolean>;
  schedule(title: string, body: string, at: Date): Promise<string>;
}

export const notifications: NotificationService = {
  async getPermissionStatus() {
    const Notifications = loadNotifications();
    if (!Notifications) return 'unavailable';
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    return current.status === 'denied' ? 'denied' : 'undetermined';
  },
  async requestPermission() {
    const Notifications = loadNotifications();
    if (!Notifications) return false;
    const current = await Notifications.getPermissionsAsync();
    const final = current.granted ? current : await Notifications.requestPermissionsAsync();
    return final.granted;
  },
  async schedule(title, body, at) {
    const Notifications = loadNotifications();
    if (!Notifications) throw new Error('Notifications are unavailable in this runtime.');
    return Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
      },
    });
  },
};
