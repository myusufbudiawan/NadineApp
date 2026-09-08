import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

// Calendar-date counterpart to TimePicker (which is deliberately time-of-day
// only) — used wherever a screen needs a plain date, e.g. a report's date
// range (Constitution 0.A #2: build the reusable field once, not per-screen).
export function DatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
}) {
  const [visible, setVisible] = useState(false);
  const display = value.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return (
    <View>
      <Text
        style={{
          fontSize: type.label,
          fontWeight: '700',
          color: colors.text,
          marginBottom: space.sm,
        }}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${display}`}
        onPress={() => setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: space.md,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <Text style={{ fontSize: type.body, color: colors.text }}>📅 {display}</Text>
        <Text style={{ color: colors.muted }}>⌄</Text>
      </Pressable>
      {visible && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, selected) => {
            setVisible(Platform.OS === 'ios');
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}
