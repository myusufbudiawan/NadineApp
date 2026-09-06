import { Ionicons } from '@expo/vector-icons';
import { AccessibilityRole, View } from 'react-native';
import { colors, radius } from '@/lib/design-system/tokens';

type Tone = 'pink' | 'violet' | 'blue' | 'yellow' | 'orange' | 'gray' | 'green';
const palettes: Record<Tone, [string, string]> = {
  pink: [colors.pinkSoft, colors.pink],
  violet: [colors.violetSoft, colors.violet],
  blue: [colors.blueSoft, colors.blue],
  yellow: [colors.yellowSoft, colors.yellow],
  orange: [colors.orangeSoft, colors.orange],
  gray: [colors.graySoft, colors.muted],
  green: [colors.greenSoft, colors.green],
};
export function IconChip({
  icon,
  tone = 'gray',
  label,
  size = 38,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  label: string;
  size?: number;
}) {
  const [backgroundColor, color] = palettes[tone];
  return (
    <View
      accessibilityRole={'image' as AccessibilityRole}
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.52} color={color} />
    </View>
  );
}
