import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

// Day + time-of-day picker for "when did this happen" fields (feeding,
// sleep, diaper, ...) — two pressables sharing one Date value, so entries
// can be backdated instead of always landing on "today".
export function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
}) {
  const [editing, setEditing] = useState<'date' | 'time'>();
  const dateDisplay = isSameCalendarDay(value, new Date())
    ? 'Today'
    : value.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeDisplay = value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} date, ${dateDisplay}`}
          onPress={() => setEditing('date')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: space.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.text} />
            <Text style={{ fontSize: type.body, color: colors.text }}>{dateDisplay}</Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} time, ${timeDisplay}`}
          onPress={() => setEditing('time')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: space.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="time-outline" size={16} color={colors.text} />
            <Text style={{ fontSize: type.body, color: colors.text }}>{timeDisplay}</Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
      </View>
      {editing && (
        <DateTimePicker
          value={value}
          mode={editing}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, selected) => {
            setEditing(Platform.OS === 'ios' ? editing : undefined);
            if (!selected) return;
            const next = new Date(value);
            if (editing === 'date') {
              next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
            } else {
              next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
            }
            onChange(next);
          }}
        />
      )}
    </View>
  );
}
