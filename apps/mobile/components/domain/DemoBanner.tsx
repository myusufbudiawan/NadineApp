import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

// Web demo only (lib/offlineOnly.ts WEB_DEMO): tells visitors the baby is
// sample data and that nothing leaves their browser. Taps through to
// Settings, where the demo can be reset or erased.
export function DemoBanner() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Demo mode. Open settings to reset or erase the sample data"
      onPress={() => router.push('/more/settings')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        padding: space.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: colors.accentSoft,
      }}
    >
      <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: type.caption, fontFamily: type.fontBodyMedium, color: colors.text }}>
          You're trying the web demo
        </Text>
        <Text style={{ fontSize: type.caption, color: colors.muted }}>
          Try logging a feed or a 2 kg weight. Everything stays in this browser.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.muted} />
    </Pressable>
  );
}
