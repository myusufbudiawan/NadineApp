import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';
export function NumericStepper({
  value,
  onChange,
  min = 0,
  step = 1,
  unit,
  label,
  rangeMin = 20,
  rangeMax = 50,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  unit: string;
  label: string;
  rangeMin?: number;
  rangeMax?: number;
}) {
  return (
    <View accessibilityLabel={label}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 32,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          hitSlop={12}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Ionicons
            name="remove-circle-outline"
            size={30}
            color={colors.muted}
          />
        </Pressable>
        <Text
          accessibilityLabel={`${value} ${unit}`}
          style={{ color: colors.violet, fontWeight: '700', fontSize: 43 }}
        >
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          hitSlop={12}
          onPress={() => onChange(value + step)}
        >
          <Ionicons name="add-circle-outline" size={30} color={colors.muted} />
        </Pressable>
      </View>
      <View
        accessible
        accessibilityLabel={`${label} ruler`}
        style={{ height: 28, flexDirection: 'row', alignItems: 'flex-start' }}
      >
        {Array.from({ length: rangeMax - rangeMin + 1 }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: i % 5 === 0 ? 18 : 10,
              borderLeftWidth: 1,
              borderColor: i + rangeMin === value ? colors.violet : colors.line,
            }}
          />
        ))}
      </View>
    </View>
  );
}
