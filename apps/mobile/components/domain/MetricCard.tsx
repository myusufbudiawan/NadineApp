import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { IconChip } from '@/components/ui/IconChip';
import { colors, type } from '@/lib/design-system/tokens';
export function MetricCard({
  icon,
  tone,
  value,
  unit,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'pink' | 'violet' | 'blue' | 'yellow';
  value: string;
  unit?: string;
  caption: string;
}) {
  return (
    <Card style={{ flex: 1, padding: 12, minHeight: 96 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <IconChip icon={icon} tone={tone} size={34} label="" />
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
          {value}
          {unit && (
            <Text style={{ fontSize: 11, fontWeight: '500' }}> {unit}</Text>
          )}
        </Text>
      </View>
      <Text
        style={{ marginTop: 10, fontSize: type.caption, color: colors.muted }}
      >
        {caption}
      </Text>
    </Card>
  );
}
