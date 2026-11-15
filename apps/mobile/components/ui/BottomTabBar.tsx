import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
import { useColumn } from '@/lib/design-system/useColumn';
import { colors, type } from '@/lib/design-system/tokens';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  track: 'clipboard-outline',
  growth: 'trending-up-outline',
  more: 'ellipsis-horizontal',
};

const labels: Record<string, string> = {
  home: 'Home',
  track: 'Track',
  growth: 'Growth',
  more: 'More',
};

export function BottomTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { maxWidth } = useColumn();
  return (
    <View
      role="tablist"
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.divider,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth,
          height: 72,
          flexDirection: 'row',
        }}
      >
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const tint = selected ? colors.accentStrong : colors.muted;
          const label = labels[route.name] ?? route.name;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                backgroundColor: pressed ? colors.graySoft : 'transparent',
              })}
            >
              <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={19} color={tint} />
              <Text
                style={{
                  fontSize: type.caption,
                  fontFamily: selected ? type.fontBodyMedium : type.fontBody,
                  color: selected ? colors.accentDeep : colors.muted,
                  // Selected state carries a rule as well as colour, so it never
                  // depends on hue alone (and survives a tinted background).
                  borderBottomWidth: 2,
                  borderBottomColor: selected ? colors.accentStrong : 'transparent',
                  paddingBottom: 2,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
