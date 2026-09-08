import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
export function ScreenHeader({
  title,
  back = false,
  right,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
}) {
  return (
    <View
      style={{
        minHeight: 40,
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
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      )}
      <Text
        style={{ fontSize: type.title, fontWeight: '800', color: colors.text, flex: 1 }}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
