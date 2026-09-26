import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { usePhotoBlur } from '@/features/privacy/PhotoBlurContext';
import { colors } from '@/lib/design-system/tokens';

// A small "eye" button that toggles the app-wide baby-photo blur (see
// PhotoBlurContext). The icon reflects the *current* state — open eye
// means the photo is visible, crossed-out means it's blurred — same
// convention as a password-visibility toggle.
export function PhotoBlurToggle({
  size = 30,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { blurred, toggleBlurred } = usePhotoBlur();
  return (
    <Pressable
      onPress={toggleBlurred}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={blurred ? "Show baby's photo" : "Blur baby's photo"}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(32,31,29,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={blurred ? 'eye-off' : 'eye'} size={size * 0.56} color={colors.white} />
    </Pressable>
  );
}
