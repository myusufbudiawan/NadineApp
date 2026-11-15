import { ReactNode } from 'react';
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
export function Button({
  children,
  onPress,
  disabled,
  variant = 'primary',
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const borderColor =
    variant === 'destructive' ? colors.danger : variant === 'secondary' ? colors.divider : colors.accent;
  const fg = variant === 'destructive' ? colors.danger : colors.accentDeep;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={(state) => [
        {
          minHeight: 44,
          paddingHorizontal: space.lg,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: disabled ? colors.line : borderColor,
          backgroundColor:
            (state.pressed || (state as { hovered?: boolean }).hovered) && !disabled
              ? colors.accentSoft
              : 'transparent',
        },
        style,
      ]}
    >
      <Text
        allowFontScaling
        style={{
          color: disabled ? colors.faint : fg,
          fontFamily: type.fontHeading,
          fontSize: type.body,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
