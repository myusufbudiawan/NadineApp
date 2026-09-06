import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { IconChip } from './IconChip';
import { colors, space, type } from '@/lib/design-system/tokens';
export function ListRow({
  icon,
  tone,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'pink' | 'violet' | 'blue' | 'yellow' | 'orange' | 'gray' | 'green';
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
      onPress={onPress}
      style={{
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.sm,
      }}
    >
      <IconChip icon={icon} tone={tone} label="" />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: type.body, fontWeight: '700', color: colors.text }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              marginTop: 3,
              color: colors.muted,
              fontSize: type.caption,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" color={colors.muted} size={19} />
    </Pressable>
  );
}
