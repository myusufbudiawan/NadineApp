import { InputAccessoryView, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { colors, space, type } from '@/lib/design-system/tokens';

// iOS's decimal-pad/number-pad keyboards have no Return key, so a numeric
// TextInput otherwise has no way to dismiss the keyboard — pass this id to
// `inputAccessoryViewID` on any such field. Mounted once at the app root;
// Android ignores InputAccessoryView entirely (it has a system back-dismiss
// already), so this is a no-op there.
export const NUMERIC_KEYBOARD_ACCESSORY_ID = 'numeric-keyboard-done';

export function KeyboardDoneBar() {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={NUMERIC_KEYBOARD_ACCESSORY_ID}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          padding: space.sm,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
      >
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={Keyboard.dismiss} hitSlop={8}>
          <Text style={{ color: colors.accent, fontFamily: type.fontBodyMedium, fontSize: type.body }}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}
