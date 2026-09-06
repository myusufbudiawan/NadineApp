import { Text, TextInput, View } from 'react-native';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

export function NotesInput({
  label = 'Notes (optional)',
  placeholder = 'e.g. tolerated well',
  value,
  onChange,
  minHeight = 88,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}) {
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
      <TextInput
        accessibilityLabel={label}
        multiline
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChange}
        style={{
          minHeight,
          textAlignVertical: 'top',
          padding: space.md,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.sm,
          fontSize: type.body,
        }}
      />
    </View>
  );
}
