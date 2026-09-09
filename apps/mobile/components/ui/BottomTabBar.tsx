import { Ionicons } from '@expo/vector-icons';
import { Href, router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
const tabs: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: Href;
}[] = [
  { label: 'Home', icon: 'home-outline', path: '/(tabs)/home' },
  { label: 'Track', icon: 'clipboard-outline', path: '/(tabs)/track' },
  { label: 'Growth', icon: 'trending-up-outline', path: '/(tabs)/growth' },
  { label: 'Tips', icon: 'bulb-outline', path: '/(tabs)/tips' },
  { label: 'More', icon: 'ellipsis-horizontal', path: '/(tabs)/more' },
];
export function BottomTabBar() {
  const path = usePathname();
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
      {tabs.map((tab) => {
        const selected = path.includes(tab.label.toLowerCase());
        const tint = selected ? colors.accentStrong : colors.faint;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => router.replace(tab.path)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Ionicons name={tab.icon} size={19} color={tint} />
            <Text
              style={{
                fontSize: 10,
                fontFamily: selected ? type.fontBodyMedium : type.fontBody,
                color: tint,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
