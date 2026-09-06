import { Text, View } from 'react-native';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors, space, type } from '@/lib/design-system/tokens';

export function UnitSelector({
  label,
  units,
  value,
  onChange,
}: {
  label: string;
  units: string[];
  value: string;
  onChange: (value: string) => void;
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
      <SegmentedControl options={units} value={value} onChange={onChange} />
    </View>
  );
}
