import { Pressable, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
export function SegmentedControl({
  options,
  value,
  onChange,
  tone = 'violet',
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  tone?: 'violet' | 'pink';
}) {
  const active = tone === 'pink' ? colors.pink : colors.violet;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        padding: 3,
        backgroundColor: colors.graySoft,
        borderRadius: radius.sm,
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
            minHeight: 42,
            borderRadius: radius.sm - 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: option === value ? active : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: type.label,
              fontWeight: '600',
              color: option === value ? colors.white : colors.muted,
            }}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
