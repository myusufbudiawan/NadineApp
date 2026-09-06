import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, View, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { BabyProfile } from '@/features/baby-profile/types';
import { validateBaby } from '@/features/baby-profile/validation';
import { queueMutation, saveProfile } from '@/lib/offline/database';
const initial: BabyProfile = {
  id: LOCAL_BABY_ID,
  name: '',
  dateOfBirth: '2026-08-17T09:20:00.000Z',
  gestationalWeeks: 32,
  gestationalDays: 3,
  birthWeightKg: 1.58,
  birthLengthCm: undefined,
  birthHeadCircumferenceCm: undefined,
  fullTermReferenceWeeks: 40,
};
const fields: { key: keyof BabyProfile; label: string; numeric?: boolean }[] = [
  { key: 'name', label: 'Baby’s name' },
  { key: 'dateOfBirth', label: 'Date and time of birth (ISO)' },
  { key: 'gestationalWeeks', label: 'Gestational age — weeks', numeric: true },
  { key: 'gestationalDays', label: 'Gestational age — days', numeric: true },
  { key: 'birthWeightKg', label: 'Birth weight (kg)', numeric: true },
  { key: 'birthLengthCm', label: 'Birth length (cm)', numeric: true },
  {
    key: 'birthHeadCircumferenceCm',
    label: 'Birth head circumference (cm)',
    numeric: true,
  },
];
export default function BabySetup() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const save = async () => {
    const next = validateBaby(profile);
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = JSON.stringify(profile);
    await saveProfile(profile.id, body);
    const uuid = Crypto.randomUUID();
    await queueMutation(uuid, 'baby-profile', body);
    router.replace('/(tabs)/home');
  };
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setProfile((p) => ({
        ...p,
        dateOfBirth: selectedDate.toISOString(),
      }));
    }
    setShowDatePicker(Platform.OS === 'ios');
  };
  return (
    <ScrollView
      contentContainerStyle={{
        padding: space.xl,
        paddingTop: insets.top + space.xl,
        gap: space.md,
      }}
    >
      <Text
        style={{ fontSize: type.title, fontWeight: '800', color: colors.text }}
      >
        Set up your baby’s profile
      </Text>
      <Text
        style={{ color: colors.muted, fontSize: type.label, lineHeight: 20 }}
      >
        These details help us show age information with the calculation basis
        clearly displayed.
      </Text>
      {fields.map((field) => (
        <View key={field.key}>
          <Text
            style={{
              fontSize: type.label,
              color: colors.text,
              fontWeight: '700',
              marginBottom: 6,
            }}
          >
            {field.label}
          </Text>
          {field.key === 'dateOfBirth' ? (
            <>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: errors[field.key] ? colors.danger : colors.line,
                  borderRadius: radius.sm,
                  minHeight: 50,
                  paddingHorizontal: space.md,
                  justifyContent: 'center',
                  backgroundColor: colors.white,
                }}
              >
                <Text style={{ fontSize: type.body, color: colors.text }}>
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : 'Select date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'compact' : 'default'}
                  onChange={handleDateChange}
                />
              )}
            </>
          ) : (
            <TextInput
              accessibilityLabel={field.label}
              value={String(profile[field.key] ?? '')}
              keyboardType={field.numeric ? 'decimal-pad' : 'default'}
              onChangeText={(text) =>
                setProfile((p) => ({
                  ...p,
                  [field.key]: field.numeric ? Number(text) : text,
                }))
              }
              style={{
                borderWidth: 1,
                borderColor: errors[field.key] ? colors.danger : colors.line,
                borderRadius: radius.sm,
                minHeight: 50,
                paddingHorizontal: space.md,
                fontSize: type.body,
                color: colors.text,
              }}
            />
          )}
          {errors[field.key] && (
            <Text
              accessibilityRole="alert"
              style={{ color: colors.danger, marginTop: 4 }}
            >
              {errors[field.key]}
            </Text>
          )}
        </View>
      ))}
      <Text style={{ color: colors.muted, fontSize: type.caption }}>
        Corrected-age reference: 40 weeks. NEEDS-CLINICAL-REVIEW — this will
        remain configurable.
      </Text>
      <Button onPress={save} style={{ marginTop: space.md }}>
        Save profile
      </Button>
    </ScrollView>
  );
}
