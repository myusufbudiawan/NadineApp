import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
export function ScreenHeader({
  title,
  back = false,
}: {
  title: string;
  back?: boolean;
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
        style={{ fontSize: type.title, fontWeight: '800', color: colors.text }}
      >
        {title}
      </Text>
    </View>
  );
}
