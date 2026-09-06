import * as Notifications from 'expo-notifications';
export interface NotificationService {
  requestPermission(): Promise<boolean>;
  schedule(title: string, body: string, at: Date): Promise<string>;
}
export const notifications: NotificationService = {
  async requestPermission() {
    const current = await Notifications.getPermissionsAsync();
    const final = current.granted
      ? current
      : await Notifications.requestPermissionsAsync();
    return final.granted;
  },
  async schedule(title, body, at) {
    return Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
      },
    });
  },
};
