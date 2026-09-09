import { Pressable, Text, View } from 'react-native';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const fullLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Multi-select day-of-week picker for recurring reminders — the one field
// shape EntryForm's segmented/stepper/text/time kinds don't cover, so it's
// its own small reusable component rather than an inline one-off (Constitution
// 0.A #2).
export function WeekdayToggle({
  value,
  onChange,
  label = 'Repeat on',
}: {
  value: number[];
  onChange: (value: number[]) => void;
  label?: string;
}) {
  const toggle = (day: number) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  };
  return (
    <View>
      <Text
        style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text, marginBottom: space.sm }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.xs }}>
        {labels.map((day, index) => {
          const active = value.includes(index);
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={fullLabels[index]}
              accessibilityState={{ selected: active }}
              onPress={() => toggle(index)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.violet : colors.graySoft,
              }}
            >
              <Text
                style={{
                  fontSize: type.caption,
                  fontFamily: type.fontBodyMedium,
                  color: active ? colors.white : colors.muted,
                }}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
