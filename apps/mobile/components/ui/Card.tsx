import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, space } from '@/lib/design-system/tokens';

export function Card({
  children,
  style,
  accessibilityLabel,
  pulse,
  onLayout,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  // Glows the border once on mount — a cue for a card a link deep-linked to.
  pulse?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}>) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return;
    Animated.sequence([
      // Let the screen settle (and scroll to the card) before the cue plays.
      Animated.delay(350),
      Animated.timing(glow, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 650, useNativeDriver: false }),
    ]).start();
  }, [pulse, glow]);

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      style={[
        {
          backgroundColor: glow.interpolate({ inputRange: [0, 1], outputRange: [colors.surface, colors.accentSoft] }),
          borderRadius: radius.md,
          padding: space.lg,
          borderWidth: 1,
          borderColor: glow.interpolate({ inputRange: [0, 1], outputRange: [colors.divider, colors.accent] }),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
