import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
export function ScreenHeader({
  title,
  back = false,
  right,
  level = 1,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
  // Tab roots are the page's <h1>; pushed screens keep level 1 too, so every
  // route has exactly one top-level heading in the web DOM.
  level?: 1 | 2;
}) {
  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -10,
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.accentDeep} />
        </Pressable>
      )}
      <Text
        role="heading"
        aria-level={level}
        style={{ fontSize: type.title, fontFamily: type.fontHeading, color: colors.text, flex: 1 }}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
