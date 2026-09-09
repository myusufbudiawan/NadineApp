import { Pressable, Text, View } from 'react-native';
import { colors, radius, type } from '@/lib/design-system/tokens';
export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  tone?: 'violet' | 'pink';
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="tab"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={{
            flex: 1,
            minHeight: 38,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: option === value ? colors.accentStrong : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: type.label,
              fontFamily: type.fontBodyMedium,
              color: option === value ? colors.surface : colors.muted,
            }}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
