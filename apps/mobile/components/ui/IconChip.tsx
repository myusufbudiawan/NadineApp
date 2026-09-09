import { Ionicons } from '@expo/vector-icons';
import { AccessibilityRole, View } from 'react-native';
import { colors } from '@/lib/design-system/tokens';

// The Classical system draws icons as plain outlined circles — currentColor
// stroke, no fill — rather than color-coding by category, so `tone` is kept
// only for prop compatibility with existing call sites and no longer
// changes the rendered color.
type Tone = 'pink' | 'violet' | 'blue' | 'yellow' | 'orange' | 'gray' | 'green';
export function IconChip({
  icon,
  label,
  size = 38,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  label: string;
  size?: number;
}) {
  return (
    <View
      accessibilityRole={'image' as AccessibilityRole}
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: colors.ring,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={colors.text} />
    </View>
  );
}
