import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EncouragementCard } from '@/components/domain/EncouragementCard';
import { GrowthChart } from '@/components/domain/GrowthChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TabScreen } from '@/components/ui/Screen';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { growthReferenceFor } from '@/features/growth/reference';
import { whoReferenceBandAt } from '@/features/growth/reference-data';
import { computeGrowthStats } from '@/features/growth/stats';
import { loadMeasurementsForMetric } from '@/features/growth/storage';
import { growthMetricLabels, GrowthMetric, GrowthMeasurement } from '@/features/growth/types';
import { correctedAge, formatAgeDetailed } from '@/lib/age';
import { colors, type } from '@/lib/design-system/tokens';

const metricOptions: GrowthMetric[] = ['weight', 'length', 'headCircumference'];

function birthValueFor(profile: BabyProfile, metric: GrowthMetric) {
  if (metric === 'weight') return { value: profile.birthWeightKg, unit: 'kg' };
  if (metric === 'length' && profile.birthLengthCm)
    return { value: profile.birthLengthCm, unit: 'cm' };
  if (metric === 'headCircumference' && profile.birthHeadCircumferenceCm)
    return { value: profile.birthHeadCircumferenceCm, unit: 'cm' };
  return undefined;
}

export default function Growth() {
  const [metric, setMetric] = useState<GrowthMetric>('weight');
  const [profile, setProfile] = useState<BabyProfile | undefined>(undefined);
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [nextProfile, nextMeasurements] = await Promise.all([
      loadBabyProfile(LOCAL_BABY_ID),
      loadMeasurementsForMetric(LOCAL_BABY_ID, metric),
    ]);
    setProfile(nextProfile);
    setMeasurements(nextMeasurements);
    setLoaded(true);
  }, [metric]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((err) => {
        console.error('growth refresh failed', err);
      });
    }, [refresh]),
  );

  if (loaded && !profile) {
    return (
      <TabScreen>
        <ScreenHeader title="Growth" />
        <Card style={{ alignItems: 'center', gap: 8, padding: 24 }}>
          <Ionicons name="trending-up-outline" size={32} color={colors.pink} />
          <Text style={{ fontSize: type.label, fontFamily: type.fontHeading, color: colors.text, textAlign: 'center' }}>
            Set up your baby's profile
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Add your baby's details to start tracking growth trends.
          </Text>
          <Button onPress={() => router.push('/baby-setup')} style={{ marginTop: 8 }}>
            Set up profile
          </Button>
        </Card>
      </TabScreen>
    );
  }

  const stats = profile ? computeGrowthStats(measurements, profile) : undefined;
  const birthValue = profile ? birthValueFor(profile, metric) : undefined;
  const currentCorrectedAge = profile
    ? correctedAge(
        new Date(profile.dateOfBirth),
        profile.gestationalWeeks,
        profile.gestationalDays,
        profile.fullTermReferenceWeeks,
      )
    : undefined;
  const referenceStandard = currentCorrectedAge
    ? growthReferenceFor(currentCorrectedAge.totalDays)
    : undefined;

  return (
    <TabScreen>
      <ScreenHeader
        title="Growth"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a growth measurement"
            onPress={() =>
              router.push(
                metric === 'weight' ? '/track/add-weight' : `/track/add-growth?metric=${metric}`,
              )
            }
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.ring,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={18} color={colors.accent} />
          </Pressable>
        }
      />
      <SegmentedControl
        options={metricOptions.map((m) => growthMetricLabels[m])}
        value={growthMetricLabels[metric]}
        onChange={(label) =>
          setMetric(metricOptions.find((m) => growthMetricLabels[m] === label) ?? 'weight')
        }
        tone="pink"
      />
      {currentCorrectedAge && (
        <Text style={{ fontSize: type.label, color: colors.muted }}>
          Corrected age{' '}
          <Text style={{ color: colors.pink, fontFamily: type.fontHeading }}>
            {formatAgeDetailed(currentCorrectedAge)}
          </Text>
        </Text>
      )}
      <GrowthChart
        points={stats?.chartPoints ?? []}
        seriesLabel={profile?.name || 'Baby'}
        unit={birthValue?.unit ?? (metric === 'weight' ? 'kg' : 'cm')}
        emptyMessage={`No ${growthMetricLabels[metric].toLowerCase()} measurements yet`}
        referenceLabel={referenceStandard?.disclaimer}
        referenceBandAt={(ageWeeks) =>
          profile ? whoReferenceBandAt(metric, ageWeeks, profile.sex) : undefined
        }
        yStep={metric === 'weight' ? 0.5 : undefined}
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Latest</Text>
          <Text style={{ fontSize: 20, fontFamily: type.fontHeading, color: colors.text }}>
            {stats?.latest ? `${stats.latest.value} ${stats.latest.unit}` : '—'}
          </Text>
          <Text style={{ color: colors.green, fontSize: 12, marginTop: 8 }}>
            {stats?.deltaVsPreviousCaption ?? (stats?.latest ? 'First reading' : 'No data yet')}
          </Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {metric === 'weight' ? 'Birth weight' : 'Latest vs 7 days'}
          </Text>
          <Text style={{ fontSize: 20, fontFamily: type.fontHeading, color: colors.text }}>
            {metric === 'weight' && birthValue ? `${birthValue.value} ${birthValue.unit}` : stats?.delta7dCaption ?? '—'}
          </Text>
          {metric === 'weight' ? (
            <Text style={{ color: colors.violet, fontSize: 12, marginTop: 8 }}>
              {stats?.delta7dCaption ?? 'Not enough data yet'}
            </Text>
          ) : null}
        </Card>
      </View>
      <EncouragementCard
        title="Great progress!"
        message={`${profile?.name || 'Your baby'} is growing well.`}
        icon="star-outline"
      />
    </TabScreen>
  );
}
