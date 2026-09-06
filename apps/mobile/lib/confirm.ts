import { Alert } from 'react-native';

// Every destructive action in the app confirms through this one dialog shape
// (Constitution 0.A #2 — no one-off confirm flows).
export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
