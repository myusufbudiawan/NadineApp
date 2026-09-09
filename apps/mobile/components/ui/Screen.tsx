import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar } from './BottomTabBar';
import { useBabySex } from '@/features/baby-profile/useBabySex';
import { colors, screenGradient, space } from '@/lib/design-system/tokens';

// Wraps screen content in the sex-tinted background gradient (a soft blush
// or soft blue fading into the same warm ground) when the baby's profile
// has a sex set, falling back to the plain canvas color before then.
function GradientGround({ style, children }: PropsWithChildren<Pick<ViewProps, 'style'>>) {
  const sex = useBabySex();
  const gradientColors = sex === 'girl' ? screenGradient.girl : sex === 'boy' ? screenGradient.boy : undefined;
  if (!gradientColors) {
    return <View style={[{ backgroundColor: colors.canvas }, style]}>{children}</View>;
  }
  return (
    <LinearGradient
      colors={gradientColors}
      locations={screenGradient.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

export function TabScreen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <GradientGround style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <BottomTabBar />
    </GradientGround>
  );
}

// Shared wrapper for pushed (non-tab) screens — Add-X forms, history lists,
// baby setup, onboarding — so top padding always clears the status bar /
// notch instead of every screen guessing its own inset (Constitution 0.A #2).
// Scrolls (content used to be clipped when it overflowed, e.g. long More
// pages) and rides up above the keyboard on iOS so a lower field never sits
// hidden behind it.
export function FormScreen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <GradientGround style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + space.lg,
            paddingHorizontal: space.xl,
            paddingBottom: insets.bottom + space.lg,
            gap: space.lg,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientGround>
  );
}
