import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren, Ref } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, ScrollViewInstance, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/features/theme/ThemeProvider';
import { useBabySex } from '@/features/baby-profile/useBabySex';
import { useColumn } from '@/lib/design-system/useColumn';
import { colors, darkGradient, screenGradient, space } from '@/lib/design-system/tokens';

// On a wide screen the tint is a top wash rather than a corner-to-corner ramp,
// so it stays symmetric around the column and clears the content sooner.
const wideGradientLocations = [0, 0.22, 0.5] as const;

// Wraps screen content in the sex-tinted background gradient (a soft blush
// or soft blue fading into the same warm ground) when the baby's profile
// has a sex set, falling back to the plain canvas color before then.
//
// The gradient fills the whole viewport — only the content column inside it
// narrows on a wide browser — so the web demo reads as one page instead of a
// phone mock-up sitting on a separate background.
function GradientGround({ style, children }: PropsWithChildren<Pick<ViewProps, 'style'>>) {
  const sex = useBabySex();
  const gradients = useTheme().scheme === 'dark' ? darkGradient : screenGradient;
  const gradientColors = sex ? gradients[sex] : undefined;
  const { isWide } = useColumn();
  if (!gradientColors) {
    return <View style={[{ backgroundColor: colors.canvas }, style]}>{children}</View>;
  }
  return (
    <LinearGradient
      colors={gradientColors}
      // A phone-sized screen is tinted corner to corner; a wide one reads
      // better tinted top-down, so the wash stays symmetric either side of the
      // content column instead of hugging the left edge.
      locations={isWide ? wideGradientLocations : screenGradient.locations}
      start={isWide ? { x: 0.5, y: 0 } : { x: 0, y: 0 }}
      end={isWide ? { x: 0.5, y: 1 } : { x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

export function TabScreen({
  children,
  refreshing,
  onRefresh,
}: PropsWithChildren<{ refreshing?: boolean; onRefresh?: () => void }>) {
  const insets = useSafeAreaInsets();
  const { maxWidth, gutter } = useColumn();
  return (
    <GradientGround style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth,
          alignSelf: 'center',
          padding: gutter,
          paddingTop: insets.top + gutter,
          // Room at the end of the scroll so the last card never sits flush
          // against the tab bar.
          paddingBottom: insets.bottom + gutter + space.sm,
          gap: space.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </GradientGround>
  );
}

// Shared wrapper for pushed (non-tab) screens — Add-X forms, history lists,
// baby setup, onboarding — so top padding always clears the status bar /
// notch instead of every screen guessing its own inset (Constitution 0.A #2).
// Scrolls (content used to be clipped when it overflowed, e.g. long More
// pages) and rides up above the keyboard on iOS so a lower field never sits
// hidden behind it.
export function FormScreen({ children, ref }: PropsWithChildren<{ ref?: Ref<ScrollViewInstance> }>) {
  const insets = useSafeAreaInsets();
  const { maxWidth, gutter } = useColumn();
  return (
    <GradientGround style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={ref}
          contentContainerStyle={{
            flexGrow: 1,
            width: '100%',
            maxWidth,
            alignSelf: 'center',
            paddingTop: insets.top + space.lg,
            paddingHorizontal: Math.max(gutter, space.lg),
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
