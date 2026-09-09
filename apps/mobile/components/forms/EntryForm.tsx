import { ReactNode, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { NUMERIC_KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardDoneBar';
import { NumericStepper } from '@/components/ui/NumericStepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { NotesInput } from './NotesInput';
import { TimePicker } from './TimePicker';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

export type EntryFormField =
  | {
      kind: 'segmented';
      key: string;
      label?: string;
      options: string[];
      initial: string;
    }
  | {
      kind: 'stepper';
      key: string;
      label: string;
      unit: string;
      initial: number;
      min?: number;
      step?: number;
      rangeMin?: number;
      rangeMax?: number;
    }
  | {
      kind: 'text';
      key: string;
      label: string;
      placeholder?: string;
      keyboardType?: 'default' | 'decimal-pad';
      initial?: string;
    }
  | { kind: 'time'; key: string; label: string; initial?: Date };

export type EntryFormValues = Record<string, string | number | Date>;

function initialValueFor(field: EntryFormField): string | number | Date {
  switch (field.kind) {
    case 'segmented':
      return field.initial;
    case 'stepper':
      return field.initial;
    case 'text':
      return field.initial ?? '';
    case 'time':
      return field.initial ?? new Date();
  }
}

// The shared skeleton behind every "Add X" screen: an ordered list of fields
// (segmented toggle / stepper / text / time) → optional extra content →
// notes → Save. Screens differ only in field configuration, never in
// structure or save behavior (Engineering Constitution 0.A #2).
export function EntryForm({
  fields,
  showNotes = true,
  initialNotes = '',
  saveLabel = 'Save',
  onSave,
  children,
}: {
  fields: EntryFormField[];
  showNotes?: boolean;
  initialNotes?: string;
  saveLabel?: string;
  onSave: (values: EntryFormValues, notes: string) => void | Promise<void>;
  children?: ReactNode;
}) {
  const [values, setValues] = useState<EntryFormValues>(() => {
    const initial: EntryFormValues = {};
    for (const field of fields) initial[field.key] = initialValueFor(field);
    return initial;
  });
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const setValue = (key: string, value: string | number | Date) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(values, notes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, gap: space.lg }}>
      {fields.map((field) => {
        switch (field.kind) {
          case 'segmented':
            return (
              <View key={field.key}>
                {field.label && (
                  <Text
                    style={{
                      fontSize: type.label,
                      fontFamily: type.fontBodyMedium,
                      color: colors.text,
                      marginBottom: space.sm,
                    }}
                  >
                    {field.label}
                  </Text>
                )}
                <SegmentedControl
                  options={field.options}
                  value={values[field.key] as string}
                  onChange={(value) => setValue(field.key, value)}
                />
              </View>
            );
          case 'stepper':
            return (
              <View key={field.key}>
                <Text style={{ fontSize: type.label, fontFamily: type.fontBodyMedium, color: colors.text }}>
                  {field.label} ({field.unit})
                </Text>
                <NumericStepper
                  value={values[field.key] as number}
                  onChange={(value) => setValue(field.key, value)}
                  min={field.min ?? 0}
                  step={field.step ?? 1}
                  unit={field.unit}
                  label={field.label}
                  rangeMin={field.rangeMin}
                  rangeMax={field.rangeMax}
                />
              </View>
            );
          case 'text':
            return (
              <View key={field.key}>
                <Text
                  style={{
                    fontSize: type.label,
                    fontFamily: type.fontBodyMedium,
                    color: colors.text,
                    marginBottom: space.sm,
                  }}
                >
                  {field.label}
                </Text>
                <TextInput
                  accessibilityLabel={field.label}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.muted}
                  keyboardType={field.keyboardType ?? 'default'}
                  returnKeyType={field.keyboardType === 'decimal-pad' ? undefined : 'done'}
                  inputAccessoryViewID={
                    field.keyboardType === 'decimal-pad' && Platform.OS === 'ios'
                      ? NUMERIC_KEYBOARD_ACCESSORY_ID
                      : undefined
                  }
                  value={String(values[field.key] ?? '')}
                  onChangeText={(text) => setValue(field.key, text)}
                  style={{
                    minHeight: 50,
                    paddingHorizontal: space.md,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: radius.sm,
                    fontSize: type.body,
                    color: colors.text,
                  }}
                />
              </View>
            );
          case 'time':
            return (
              <TimePicker
                key={field.key}
                label={field.label}
                value={values[field.key] as Date}
                onChange={(value) => setValue(field.key, value)}
              />
            );
        }
      })}
      {children}
      {showNotes && <NotesInput value={notes} onChange={setNotes} />}
      <View style={{ marginTop: 'auto' }}>
        <Button onPress={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </View>
    </View>
  );
}
