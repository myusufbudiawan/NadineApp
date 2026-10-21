import { Alert, AlertButton, Platform } from 'react-native';

// react-native-web ships Alert.alert as a no-op, which would silently swallow
// every error message and confirmation (deletes, backup import, ...) in the
// web demo. Route it to the browser's own dialogs instead. Imported once for
// its side effect from app/_layout.tsx.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[], options?) => {
    const text = message ? `${title}\n\n${message}` : title;
    const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
    const cancel = (buttons ?? []).find((b) => b.style === 'cancel');

    if (actions.length <= 1 && !cancel) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }
    // A cancel button plus one or more actions: offer each action in turn
    // (e.g. "Relive the celebration" / "Remove" on a milestone), first
    // accepted one wins.
    for (const action of actions) {
      const prompt = actions.length > 1 ? `${text}\n\n${action.text}?` : text;
      if (window.confirm(prompt)) {
        action.onPress?.();
        return;
      }
    }
    cancel?.onPress?.();
    options?.onDismiss?.();
  };
}
