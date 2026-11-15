import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { IconChip } from '@/components/ui/IconChip';
import { colors, numerals, type } from '@/lib/design-system/tokens';
export function MetricCard({
  icon,
  tone,
  value,
  unit,
  caption,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'pink' | 'violet' | 'blue' | 'yellow';
  value: string;
  unit?: string;
  caption: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={(state) => ({
        flex: 1,
        // The card paints its own surface, so press feedback rides on the
        // wrapper rather than fighting Card's border animation.
        opacity: state.pressed ? 0.85 : 1,
      })}
    >
      <Card style={{ padding: 12, minHeight: 96 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <IconChip icon={icon} tone={tone} size={34} label="" />
          <Text style={{ fontSize: 24, fontFamily: type.fontHeading, color: colors.text, ...numerals }}>
            {value}
            {unit && (
              <Text style={{ fontSize: type.caption, fontFamily: type.fontBody }}> {unit}</Text>
            )}
          </Text>
        </View>
        <Text
          style={{ marginTop: 10, fontSize: type.micro, color: colors.muted, fontFamily: type.fontBody, lineHeight: 17 }}
        >
          {caption}
        </Text>
      </Card>
    </Pressable>
  );
}
