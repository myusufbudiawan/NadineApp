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
  const bg =
    variant === 'destructive' ? colors.danger : variant === 'secondary' ? colors.violetSoft : colors.violet;
  const fg = variant === 'secondary' ? colors.violet : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          minHeight: 52,
          paddingHorizontal: space.lg,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.sm,
          backgroundColor: disabled ? colors.line : bg,
        },
        style,
      ]}
    >
      <Text
        allowFontScaling
        style={{ color: disabled ? colors.muted : fg, fontSize: type.body, fontWeight: '700' }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
