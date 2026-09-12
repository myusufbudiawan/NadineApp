import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
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
import { CareEventType } from '@/features/care-events/types';
import { getDashboardMetricView } from '@/features/dashboard/metricConfig';
import { defaultDashboardMetrics, loadDashboardMetrics } from '@/features/dashboard/preferences';
import { loadReminders, ReminderView } from '@/features/reminders/storage';
import { reminderTypeLabels } from '@/features/reminders/types';
import { actualAge, correctedAge, toAge } from '@/lib/age';
import { getDailyEncouragement } from '@/lib/encouragement';
import { getGreeting } from '@/lib/greeting';
import { saveProfile } from '@/lib/offline/database';
import { hydrateFromServer } from '@/lib/offline/hydrate';
import { getServerBabyId } from '@/lib/offline/serverBaby';
import { runSync } from '@/lib/offline/sync';
import { colors, type } from '@/lib/design-system/tokens';

function SyncBanner({ status }: { status: 'success' | 'error' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [opacity]);
  const success = status === 'success';
  return (
    <Animated.View
      style={{
        opacity,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: success ? colors.accentStrong : '#D9534F',
      }}
    >
      <Ionicons
        name={success ? 'checkmark-circle' : 'alert-circle'}
        size={14}
        color={colors.white}
      />
      <Text style={{ color: colors.white, fontSize: type.caption, fontFamily: type.fontBodyMedium }}>
        {success ? 'Synced' : "Couldn't sync — will retry"}
      </Text>
    </Animated.View>
  );
}

function formatDueLabel(date: Date, now: Date) {
  const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return 'now';
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.round(minutes / 60);
  return `in ${hours} hour${hours === 1 ? '' : 's'}`;
}

export default function Home() {
  const [profile, setProfile] = useState<BabyProfile | undefined>(undefined);
  const [summary, setSummary] = useState<TodaySummary | undefined>(undefined);
  const [upcoming, setUpcoming] = useState<ReminderView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error'>();
  const [dashboardMetrics, setDashboardMetrics] = useState<CareEventType[]>(defaultDashboardMetrics);

  const refresh = useCallback(async () => {
    const [nextProfile, nextSummary, reminders] = await Promise.all([
      loadBabyProfile(LOCAL_BABY_ID),
      computeTodaySummary(LOCAL_BABY_ID),
      loadReminders(LOCAL_BABY_ID),
    ]);
    setProfile(nextProfile);
    setSummary(nextSummary);
    setUpcoming(
      reminders
        .filter((r) => r.enabled && r.nextFiresAt)
        .sort((a, b) => a.nextFiresAt!.getTime() - b.nextFiresAt!.getTime())
        .slice(0, 2),
    );
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((err) => {
        console.error('home refresh failed', err);
      });
    }, [refresh]),
  );

  // Kept independent of `refresh` (which waits on SQLite-backed reads) so the
  // dashboard's tile selection — a fast, local-only preference — always
  // applies even if the data-backed summary is slow to resolve.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadDashboardMetrics().then((metrics) => {
        if (active) setDashboardMetrics(metrics);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const onPullToRefresh = useCallback(async () => {
    setRefreshing(true);
    setSyncStatus(undefined);
    try {
      const summary = await runSync();
      const serverBabyId = await getServerBabyId();
      if (serverBabyId) await hydrateFromServer(serverBabyId);
      await refresh();
      setSyncStatus(summary.failed > 0 ? 'error' : 'success');
    } catch (err) {
      console.error('home pull-to-refresh sync failed', err);
      setSyncStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const pickPhoto = async () => {
    if (!profile || profile.isOwner === false) return;
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
      <TabScreen refreshing={refreshing} onRefresh={onPullToRefresh}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{ color: colors.text, fontSize: type.title, fontFamily: type.fontHeading }}
            >
              {getGreeting()}
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
  let pma: { label: string; fullTermWeeks: number; percent: number } | undefined;

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
    // due date (Section 8.2) — expected, not an error, so the sign is kept
    // as-is rather than clamped or relabeled.
    heroCorrectedAge = { label: `${corrected.totalDays} days`, sub: postmenstrualLabel };
    const sexLabel = profile.sex === 'girl' ? 'Girl' : 'Boy';
    bornSummary = `${sexLabel} · Born ${profile.gestationalWeeks}w ${profile.gestationalDays}d${
      profile.birthWeightKg ? ` · ${profile.birthWeightKg} kg` : ''
    }`;
    const fullTermWeeks = profile.fullTermReferenceWeeks;
    pma = {
      label: `${postmenstrual.weeks}w ${postmenstrual.days}d Post-Menstrual Age`,
      fullTermWeeks,
      percent: Math.min(100, Math.max(0, (postmenstrualDays / (fullTermWeeks * 7)) * 100)),
    };
  }

  return (
    <TabScreen refreshing={refreshing} onRefresh={onPullToRefresh}>
      {syncStatus && <SyncBanner key={Date.now()} status={syncStatus} />}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text
            style={{
              color: colors.text,
              fontSize: type.title,
              fontFamily: type.fontHeading,
            }}
          >
            {getGreeting()}
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
        onPressPhoto={profile?.isOwner === false ? undefined : pickPhoto}
      />
      {pma && (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>{pma.label}</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>Due at {pma.fullTermWeeks}w</Text>
          </View>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.line,
              marginTop: 6,
              overflow: 'hidden',
            }}
          >
            <View style={{ height: '100%', width: `${pma.percent}%`, backgroundColor: colors.accent }} />
          </View>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontSize: 16, fontFamily: type.fontHeading, color: colors.text }}>
          Today
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text
            accessibilityRole="link"
            onPress={() => router.push('/more/customize-dashboard')}
            style={{ fontSize: 11, color: colors.accentStrong }}
          >
            Customize
          </Text>
          <Text style={{ fontSize: 11, color: colors.faint }}>since midnight</Text>
        </View>
      </View>
      {[0, 2].map((rowStart) => (
        <View key={rowStart} style={{ flexDirection: 'row', gap: 10 }}>
          {dashboardMetrics.slice(rowStart, rowStart + 2).map((metricType) => {
            const metric = getDashboardMetricView(metricType, summary);
            return (
              <MetricCard
                key={metric.type}
                icon={metric.icon}
                tone={metric.tone}
                value={metric.value}
                unit={metric.unit}
                caption={metric.caption}
                onPress={() => router.push(metric.route as never)}
              />
            );
          })}
        </View>
      ))}
      {upcoming.length > 0 && (
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              paddingTop: 18,
            }}
          >
            <Text style={{ fontSize: 16, fontFamily: type.fontHeading, color: colors.text }}>
              Next due
            </Text>
            <Text
              accessibilityRole="link"
              onPress={() => router.push('/more/reminders')}
              style={{ fontSize: 11, color: colors.accentStrong }}
            >
              All reminders
            </Text>
          </View>
          {upcoming.map((r) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                gap: 14,
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: type.fontHeading,
                  color: colors.text,
                  width: 48,
                }}
              >
                {r.nextFiresAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: type.fontBodyMedium, color: colors.text }}>
                  {r.title}
                </Text>
                <Text style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>
                  {reminderTypeLabels[r.type]} · {r.nextFiresAt ? formatDueLabel(r.nextFiresAt, new Date()) : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <EncouragementCard
        title="A little encouragement"
        message={getDailyEncouragement()}
      />
    </TabScreen>
  );
}
