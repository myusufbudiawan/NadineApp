import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile, BabySex } from '@/features/baby-profile/types';
import { validateBaby } from '@/features/baby-profile/validation';
import { createBaby, updateBaby } from '@/lib/api/babies';
import { ApiError } from '@/lib/api/client';
import { queueMutation, saveProfile } from '@/lib/offline/database';
import { getServerBabyId, setLocalDataOwner, setServerBabyId } from '@/lib/offline/serverBaby';
import { supabase } from '@/lib/supabase/client';
import * as Crypto from 'expo-crypto';
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
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => {
    let active = true;
    loadBabyProfile(LOCAL_BABY_ID).then((existing) => {
      if (active && existing) {
        setProfile(existing);
        setIsEditing(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const save = async () => {
    const next = validateBaby(profile);
    setErrors(next);
    if (Object.keys(next).length) return;
    const validated = profile as BabyProfile;
    await saveProfile(validated.id, JSON.stringify(validated));

    // Baby-profile edits push to the server directly first (Local storage
    // always stays keyed by LOCAL_BABY_ID — every screen expects that; the
    // server's real id is tracked separately via getServerBabyId/
    // setServerBabyId). On failure this falls back to the same
    // mutation_queue/backoff sync.ts already uses for care events.
    const { id: _localId, ...payload } = validated;
    try {
      const existingServerId = await getServerBabyId();
      if (existingServerId) {
        await updateBaby(existingServerId, payload);
      } else {
        const created = await createBaby(payload);
        await setServerBabyId(created.id);
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) await setLocalDataOwner(data.session.user.id);
    } catch (err) {
      // Retry later via the same mutation queue/backoff care-events use
      // (see lib/offline/sync.ts), instead of losing this write silently.
      console.warn('baby-profile: server save failed, queued for retry', err);
      await queueMutation(Crypto.randomUUID(), 'baby-profile', JSON.stringify(payload));
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
            fontWeight: '700',
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
        {isEditing ? 'Save changes' : 'Save profile'}
      </Button>
    </ScrollView>
  );
}
