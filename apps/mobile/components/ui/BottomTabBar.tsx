import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
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

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        height: 72,
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.divider,
      }}
    >
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const tint = selected ? colors.accentStrong : colors.faint;
        const label = labels[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!selected && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={19} color={tint} />
            <Text
              style={{
                fontSize: 10,
                fontFamily: selected ? type.fontBodyMedium : type.fontBody,
                color: tint,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
