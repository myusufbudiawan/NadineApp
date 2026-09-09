import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { BabyHeroCard } from '@/components/domain/BabyHeroCard';
import { EncouragementCard } from '@/components/domain/EncouragementCard';
import { MetricCard } from '@/components/domain/MetricCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TabScreen } from '@/components/ui/Screen';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { pushBabyProfile } from '@/features/baby-profile/pushToServer';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { computeTodaySummary, TodaySummary } from '@/features/care-events/todaySummary';
import { actualAge, correctedAge, toAge } from '@/lib/age';
import { saveProfile } from '@/lib/offline/database';
import { colors, type } from '@/lib/design-system/tokens';

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Home() {
  const [profile, setProfile] = useState<BabyProfile | undefined>(undefined);
  const [summary, setSummary] = useState<TodaySummary | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [nextProfile, nextSummary] = await Promise.all([
      loadBabyProfile(LOCAL_BABY_ID),
      computeTodaySummary(LOCAL_BABY_ID),
    ]);
    setProfile(nextProfile);
    setSummary(nextSummary);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((err) => {
        console.error('home refresh failed', err);
      });
    }, [refresh]),
  );

  const pickPhoto = async () => {
    if (!profile) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const next: BabyProfile = { ...profile, photoUri: result.assets[0].uri };
    await saveProfile(next.id, JSON.stringify(next));
    setProfile(next);
    pushBabyProfile(next).catch((err) => {
      console.warn('baby photo: server sync failed, queued for retry', err);
    });
  };

  if (loaded && !profile) {
    return (
      <TabScreen>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ color: colors.muted, fontSize: type.label }}>
              Good morning,
            </Text>
            <Text
              style={{ color: colors.text, fontSize: type.title, fontFamily: type.fontHeading }}
            >
              Mama <Text style={{ color: colors.pink }}>♥</Text>
            </Text>
          </View>
          <Ionicons
            accessibilityLabel="Notifications"
            name="notifications-outline"
            size={22}
            color={colors.text}
          />
        </View>
        <Card style={{ alignItems: 'center', gap: 8, padding: 24 }}>
          <Ionicons name="person-add-outline" size={32} color={colors.pink} />
          <Text
            style={{
              fontSize: type.label,
              fontFamily: type.fontHeading,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            Set up your baby's profile
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Add your baby's details to see their age and daily summary here.
          </Text>
          <Button onPress={() => router.push('/baby-setup')} style={{ marginTop: 8 }}>
            Set up profile
          </Button>
        </Card>
      </TabScreen>
    );
  }

  let heroActualAge: { label: string; sub: string } | undefined;
  let heroCorrectedAge: { label: string; sub: string } | undefined;
  let bornSummary: string | undefined;

  if (profile) {
    const dob = new Date(profile.dateOfBirth);
    const actual = actualAge(dob);
    const corrected = correctedAge(
      dob,
      profile.gestationalWeeks,
      profile.gestationalDays,
      profile.fullTermReferenceWeeks,
    );
    const postmenstrualDays =
      profile.gestationalWeeks * 7 + profile.gestationalDays + actual.totalDays;
    const postmenstrual = toAge(postmenstrualDays);
    const postmenstrualLabel = `(${postmenstrual.weeks}w ${postmenstrual.days}d)`;

    heroActualAge = { label: `${actual.totalDays} days`, sub: postmenstrualLabel };
    // Corrected age is negative until a preterm baby reaches its full-term
    // due date (Section 8.2) — expected, not an error, so it's labeled
    // rather than shown as a bare negative number.
    heroCorrectedAge = {
      label:
        corrected.totalDays < 0
          ? `${Math.abs(corrected.totalDays)} days pre-term`
          : `${corrected.totalDays} days`,
      sub: postmenstrualLabel,
    };
    const sexLabel = profile.sex === 'girl' ? 'Girl' : 'Boy';
    bornSummary = `${sexLabel} · Born ${profile.gestationalWeeks}w ${profile.gestationalDays}d${
      profile.birthWeightKg ? ` · ${profile.birthWeightKg} kg` : ''
    }`;
  }

  return (
    <TabScreen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ color: colors.muted, fontSize: type.label }}>
            Good morning,
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: type.title,
              fontFamily: type.fontHeading,
            }}
          >
            Mama
          </Text>
        </View>
        <Ionicons
          accessibilityLabel="Notifications"
          name="notifications-outline"
          size={22}
          color={colors.text}
        />
      </View>
      <BabyHeroCard
        name={profile?.name || 'Your baby'}
        imageUrl={profile?.photoUri}
        bornSummary={bornSummary}
        actualAge={heroActualAge}
        correctedAge={heroCorrectedAge}
        onPressPhoto={pickPhoto}
      />
      <Text
        style={{ fontSize: type.label, fontFamily: type.fontHeading, color: colors.text }}
      >
        Today at a glance
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard
          icon="scale-outline"
          tone="pink"
          value={summary?.weight.hasAny ? String(summary.weight.value) : '—'}
          unit={summary?.weight.hasAny ? summary?.weight.unit : undefined}
          caption={summary?.weight.hasAny ? summary!.weight.deltaCaption! : 'No weight logged yet'}
        />
        <MetricCard
          icon="water-outline"
          tone="violet"
          value={summary?.feeding.hasAny ? String(summary.feeding.lastAmount ?? '—') : '—'}
          unit={summary?.feeding.hasAny ? summary?.feeding.lastUnit : undefined}
          caption={
            summary?.feeding.hasAny
              ? `${summary.feeding.todayCount} feeds today`
              : 'No feeding logged yet'
          }
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <MetricCard
          icon="moon-outline"
          tone="blue"
          value={summary?.sleep.hasAny ? formatDuration(summary.sleep.todayTotalMinutes) : '—'}
          caption={summary?.sleep.hasAny ? 'Total sleep today' : 'No sleep logged yet'}
        />
        <MetricCard
          icon="happy-outline"
          tone="yellow"
          value={summary?.diaper.hasAny ? String(summary.diaper.todayCount) : '—'}
          caption={
            summary?.diaper.hasAny
              ? `Wet ${summary.diaper.wet} / Dirty ${summary.diaper.dirty}`
              : 'No diaper logged yet'
          }
        />
      </View>
      <EncouragementCard
        title="Today's goal"
        message="Keep going Mama! You're doing an amazing job."
      />
    </TabScreen>
  );
}
