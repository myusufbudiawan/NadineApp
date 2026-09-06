import { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, space } from '@/lib/design-system/tokens';

export function Card({
  children,
  style,
  accessibilityLabel,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radius.md,
          padding: space.lg,
          borderWidth: 1,
          borderColor: colors.line,
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
