import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, TextInput, View } from 'react-native';
import { colors, type } from '@/lib/design-system/tokens';

function decimalsForStep(step: number) {
  const text = step.toString();
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

function roundToStep(value: number, step: number) {
  const decimals = decimalsForStep(step);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Vertical drag distance (px) needed to move the value by one `step`.
const PX_PER_STEP = 14;

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
  const decimals = decimalsForStep(step);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const dragBase = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const commit = (next: number) => onChangeRef.current(Math.max(min, roundToStep(next, step)));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        dragBase.current = valueRef.current;
      },
      onPanResponderMove: (_event, gesture) => {
        const deltaSteps = Math.round(-gesture.dy / PX_PER_STEP);
        commit(dragBase.current + deltaSteps * step);
      },
    }),
  ).current;

  const startEditing = () => {
    setDraft(value.toFixed(decimals));
    setEditing(true);
  };

  const commitEditing = () => {
    const parsed = Number(draft);
    if (!Number.isNaN(parsed)) commit(parsed);
    setEditing(false);
  };

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
          onPress={() => commit(value - step)}
        >
          <Ionicons
            name="remove-circle-outline"
            size={30}
            color={colors.muted}
          />
        </Pressable>
        {editing ? (
          <TextInput
            accessibilityLabel={`${label} value`}
            autoFocus
            selectTextOnFocus
            keyboardType="decimal-pad"
            value={draft}
            onChangeText={setDraft}
            onBlur={commitEditing}
            onSubmitEditing={commitEditing}
            style={{
              color: colors.violet,
              fontWeight: '700',
              fontSize: 43,
              minWidth: 100,
              textAlign: 'center',
            }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${value.toFixed(decimals)} ${unit}. Double tap to type a value, or drag up and down to adjust.`}
            onPress={startEditing}
            {...panResponder.panHandlers}
          >
            <Text
              style={{ color: colors.violet, fontWeight: '700', fontSize: 43 }}
            >
              {value.toFixed(decimals)}
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          hitSlop={12}
          onPress={() => commit(value + step)}
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
              borderColor:
                Math.round(value) === i + rangeMin ? colors.violet : colors.line,
            }}
          />
        ))}
      </View>
    </View>
  );
}
