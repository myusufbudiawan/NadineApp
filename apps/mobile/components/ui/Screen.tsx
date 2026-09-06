import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar } from './BottomTabBar';
import { colors, space } from '@/lib/design-system/tokens';

export function TabScreen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, gap: 18 }}
      >
        {children}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

// Shared wrapper for pushed (non-tab) screens — Add-X forms, history lists,
// baby setup, onboarding — so top padding always clears the status bar /
// notch instead of every screen guessing its own inset (Constitution 0.A #2).
export function FormScreen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvas,
        paddingTop: insets.top + space.lg,
        paddingHorizontal: space.xl,
        paddingBottom: insets.bottom + space.lg,
        gap: space.lg,
      }}
    >
      {children}
    </View>
  );
}
