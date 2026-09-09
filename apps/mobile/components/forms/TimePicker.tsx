import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

export function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
}) {
  const [visible, setVisible] = useState(false);
  const display = `Today, ${value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
  return (
    <View>
      <Text
        style={{
          fontSize: type.label,
          fontFamily: type.fontBodyMedium,
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
        <Text style={{ fontSize: type.body, color: colors.text }}>◷ {display}</Text>
        <Text style={{ color: colors.muted }}>⌄</Text>
      </Pressable>
      {visible && (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, selected) => {
            setVisible(Platform.OS === 'ios');
            if (selected) {
              const next = new Date(value);
              next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
              onChange(next);
            }
          }}
        />
      )}
    </View>
  );
}
