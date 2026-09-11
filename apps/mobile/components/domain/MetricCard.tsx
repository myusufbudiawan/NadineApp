import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { IconChip } from '@/components/ui/IconChip';
import { colors, type } from '@/lib/design-system/tokens';
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
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ flex: 1 }}
    >
      <Card style={{ padding: 12, minHeight: 96 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <IconChip icon={icon} tone={tone} size={34} label="" />
          <Text style={{ fontSize: 24, fontFamily: type.fontHeading, color: colors.text }}>
            {value}
            {unit && (
              <Text style={{ fontSize: 12, fontFamily: type.fontBody }}> {unit}</Text>
            )}
          </Text>
        </View>
        <Text
          style={{ marginTop: 10, fontSize: type.caption, color: colors.muted, fontFamily: type.fontBody }}
        >
          {caption}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}
