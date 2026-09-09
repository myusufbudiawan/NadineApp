import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { NUMERIC_KEYBOARD_ACCESSORY_ID } from '@/components/ui/KeyboardDoneBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile, BabySex } from '@/features/baby-profile/types';
import { validateBaby } from '@/features/baby-profile/validation';
import { ApiError } from '@/lib/api/client';
import { saveProfile } from '@/lib/offline/database';
import { setLocalDataOwner } from '@/lib/offline/serverBaby';
import { supabase } from '@/lib/supabase/client';
import { pushBabyProfile } from '@/features/baby-profile/pushToServer';
type DraftProfile = Omit<BabyProfile, 'sex'> & { sex?: BabySex };
const initial: DraftProfile = {
  id: LOCAL_BABY_ID,
  name: '',
  sex: undefined,
  dateOfBirth: '2026-08-17T09:20:00.000Z',
  gestationalWeeks: 32,
  gestationalDays: 3,
  birthWeightKg: 1.58,
  birthLengthCm: undefined,
  birthHeadCircumferenceCm: undefined,
  fullTermReferenceWeeks: 40,
};
const sexOptions: { label: string; value: BabySex }[] = [
  { label: 'Girl', value: 'girl' },
  { label: 'Boy', value: 'boy' },
];
const fields: { key: keyof BabyProfile; label: string; numeric?: boolean; optional?: boolean }[] = [
  { key: 'name', label: 'Baby’s name' },
  { key: 'dateOfBirth', label: 'Date and time of birth (ISO)' },
  { key: 'gestationalWeeks', label: 'Gestational age — weeks', numeric: true },
  { key: 'gestationalDays', label: 'Gestational age — days', numeric: true },
  { key: 'birthWeightKg', label: 'Birth weight (kg)', numeric: true },
  { key: 'birthLengthCm', label: 'Birth length (cm)', numeric: true, optional: true },
  {
    key: 'birthHeadCircumferenceCm',
    label: 'Birth head circumference (cm)',
    numeric: true,
    optional: true,
  },
];
function draftsFrom(source: DraftProfile): Record<string, string> {
  const d: Record<string, string> = {};
  for (const f of fields) if (f.numeric) d[f.key] = String(source[f.key as keyof DraftProfile] ?? '');
  return d;
}

export default function BabySetup() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(initial);
  // Numeric fields are typed as free text here rather than parsed to a
  // Number on every keystroke — coercing eagerly (the old behavior) snaps
  // an in-progress "0." or "-" back to "0" mid-type, since Number("0.") is
  // 0, so the decimal point the user just typed visibly disappears. The
  // draft only gets parsed into `profile` (and validated) on save.
  const [drafts, setDrafts] = useState(() => draftsFrom(initial));
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => {
    let active = true;
    loadBabyProfile(LOCAL_BABY_ID).then((existing) => {
      if (active && existing) {
        setProfile(existing);
        setDrafts(draftsFrom(existing));
        setIsEditing(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const save = async () => {
    const numeric: Partial<BabyProfile> = {};
    for (const f of fields) {
      if (!f.numeric) continue;
      const raw = drafts[f.key]?.trim() ?? '';
      // A blank optional field (length/head circumference) means "not
      // recorded" — undefined. A blank required field, or anything that
      // doesn't parse, becomes NaN so the existing range checks in
      // validateBaby (which all reject NaN) surface it as a normal
      // validation error rather than silently keeping a stale value.
      (numeric as Record<string, number | undefined>)[f.key] =
        raw === '' ? (f.optional ? undefined : NaN) : Number(raw);
    }
    const candidate: DraftProfile = { ...profile, ...numeric };
    const next = validateBaby(candidate);
    setErrors(next);
    if (Object.keys(next).length) return;
    setProfile(candidate);
    const validated = candidate as BabyProfile;
    await saveProfile(validated.id, JSON.stringify(validated));

    // Baby-profile edits push to the server directly first (Local storage
    // always stays keyed by LOCAL_BABY_ID — every screen expects that; the
    // server's real id is tracked separately via getServerBabyId/
    // setServerBabyId). On failure this falls back to the same
    // mutation_queue/backoff sync.ts already uses for care events.
    try {
      await pushBabyProfile(validated);
      const { data } = await supabase.auth.getSession();
      if (data.session) await setLocalDataOwner(data.session.user.id);
    } catch (err) {
      Alert.alert(
        'Saved on this device',
        err instanceof ApiError
          ? `Your baby's profile is saved here but couldn't sync yet: ${err.message}`
          : "Your baby's profile is saved here but couldn't sync yet. Check your connection.",
      );
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          padding: space.xl,
          paddingTop: insets.top + space.xl,
          paddingBottom: insets.bottom + space.xl,
          gap: space.md,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
      <Text
        style={{ fontSize: type.title, fontFamily: type.fontHeading, color: colors.text }}
      >
        {isEditing ? 'Edit your baby’s profile' : 'Set up your baby’s profile'}
      </Text>
      <Text
        style={{ color: colors.muted, fontSize: type.label, lineHeight: 20 }}
      >
        These details help us show age information with the calculation basis
        clearly displayed.
      </Text>
      <View>
        <Text
          style={{
            fontSize: type.label,
            color: colors.text,
            fontFamily: type.fontBodyMedium,
            marginBottom: 6,
          }}
        >
          Baby's sex
        </Text>
        <SegmentedControl
          options={sexOptions.map((o) => o.label)}
          value={
            sexOptions.find((o) => o.value === profile.sex)?.label ?? ''
          }
          onChange={(label) =>
            setProfile((p) => ({
              ...p,
              sex: sexOptions.find((o) => o.label === label)!.value,
            }))
          }
          tone="pink"
        />
        {errors.sex && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.danger, marginTop: 4 }}
          >
            {errors.sex}
          </Text>
        )}
      </View>
      {fields.map((field) => (
        <View key={field.key}>
          <Text
            style={{
              fontSize: type.label,
              color: colors.text,
              fontFamily: type.fontBodyMedium,
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
              value={field.numeric ? (drafts[field.key] ?? '') : String(profile[field.key] ?? '')}
              keyboardType={field.numeric ? 'decimal-pad' : 'default'}
              inputAccessoryViewID={
                field.numeric && Platform.OS === 'ios' ? NUMERIC_KEYBOARD_ACCESSORY_ID : undefined
              }
              returnKeyType={field.numeric ? undefined : 'done'}
              onChangeText={(text) =>
                field.numeric
                  ? setDrafts((d) => ({ ...d, [field.key]: text }))
                  : setProfile((p) => ({ ...p, [field.key]: text }))
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
        {isEditing ? 'Save changes' : 'Save profile'}
      </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
