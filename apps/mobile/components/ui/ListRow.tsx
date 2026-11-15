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
      style={(state) => ({
        minHeight: 66,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: space.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        // react-native-web adds `hovered`/`focused` to the Pressable state;
        // native only knows `pressed`, so the cast stays local to this file.
        backgroundColor:
          state.pressed || (state as { hovered?: boolean }).hovered ? colors.graySoft : 'transparent',
      })}
    >
      <IconChip icon={icon} tone={tone} label="" />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: type.body, fontFamily: type.fontBodyMedium, color: colors.text }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              marginTop: 3,
              color: colors.muted,
              fontSize: type.small,
              fontFamily: type.fontBody,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" color={colors.accentDeep} size={17} />
    </Pressable>
  );
}
