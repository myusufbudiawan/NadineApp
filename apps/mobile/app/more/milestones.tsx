import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePicker } from '@/components/forms/DatePicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { requestCelebration } from '@/features/milestones/celebrate';
import { detectMilestones } from '@/features/milestones/detect';
import {
  loadMilestones,
  markMilestone,
  MilestoneRecords,
  subscribeToMilestones,
  unmarkMilestone,
} from '@/features/milestones/storage';
import {
  daysSinceBirth,
  MilestoneDefinition,
  milestoneChapters,
  milestonesFor,
} from '@/features/milestones/types';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

const NODE = 30;
// iOS can't present a new Modal while another (the sheet, an Alert) is still
// animating away, so the celebration waits for that dismissal to finish.
const DISMISS_MS = 450;
const celebrateAfterDismiss = (id: MilestoneDefinition['id']) =>
  setTimeout(() => requestCelebration(id), DISMISS_MS);

export default function Milestones() {
  const [profile, setProfile] = useState<BabyProfile>();
  const [records, setRecords] = useState<MilestoneRecords>({});
  const [marking, setMarking] = useState<MilestoneDefinition>();

  const refresh = useCallback(async () => {
    const [p, r] = await Promise.all([loadBabyProfile(LOCAL_BABY_ID), loadMilestones()]);
    setProfile(p);
    setRecords(r);
    if (p) await detectMilestones(LOCAL_BABY_ID, p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh().catch((err) => console.warn('milestones refresh failed', err));
    }, [refresh]),
  );
  useEffect(
    () => subscribeToMilestones(() => loadMilestones().then(setRecords).catch(() => {})),
    [],
  );

  if (!profile) {
    return (
      <FormScreen>
        <ScreenHeader title="Milestones" back />
        <Text style={{ color: colors.muted }}>Set up your baby's profile to start the journey.</Text>
      </FormScreen>
    );
  }

  const name = profile.name || 'Your baby';
  const all = milestonesFor(profile);
  const achievedCount = all.filter((m) => records[m.id]).length;
  const homecoming = all.find((m) => m.grand);
  const homeRecord = homecoming ? records[homecoming.id] : undefined;

  const onPressAchieved = (m: MilestoneDefinition) => {
    Alert.alert(m.title, undefined, [
      { text: 'Relive the celebration', onPress: () => celebrateAfterDismiss(m.id) },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => unmarkMilestone(m.id).catch(() => {}),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <FormScreen>
      <ScreenHeader title="Milestones" back />

      <View style={{ gap: space.sm }}>
        <Text style={{ fontFamily: type.fontHeading, fontSize: type.display, color: colors.text }}>
          {name}'s journey
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.label }}>
          {achievedCount === 0
            ? 'Every step deserves a celebration.'
            : `${achievedCount} of ${all.length} milestones celebrated`}
        </Text>
        <View style={{ height: 3, backgroundColor: colors.line, borderRadius: 2, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              width: `${(achievedCount / all.length) * 100}%`,
              backgroundColor: colors.accent,
            }}
          />
        </View>
      </View>

      {homecoming && (
        <Card
          style={{
            backgroundColor: colors.accentSoft,
            borderColor: colors.accent,
            alignItems: 'center',
            gap: space.sm,
            paddingVertical: space.xl,
          }}
        >
          <Ionicons name={homeRecord ? 'home' : 'home-outline'} size={30} color={colors.accent} />
          <Text style={{ fontFamily: type.fontHeading, fontSize: 22, color: colors.accentDeep, textAlign: 'center' }}>
            {homeRecord ? `${name} is home` : `The day ${name} comes home`}
          </Text>
          <Text style={{ color: colors.accentDeep, fontSize: type.caption, textAlign: 'center' }}>
            {homeRecord
              ? `Since ${formatDate(homeRecord.achievedAt)} · after ${daysSinceBirth(profile, new Date(homeRecord.achievedAt))} days`
              : 'When the day comes, mark it here — we’ll celebrate together.'}
          </Text>
          <Button
            style={{ marginTop: space.sm, minWidth: 200 }}
            onPress={() => (homeRecord ? onPressAchieved(homecoming) : setMarking(homecoming))}
          >
            {homeRecord ? 'Relive homecoming' : 'We’re going home'}
          </Button>
        </Card>
      )}

      {milestoneChapters
        .filter((chapter) => chapter !== 'Going home')
        .map((chapter) => {
          const items = all.filter((m) => m.chapter === chapter);
          if (items.length === 0) return null;
          return (
            <View key={chapter}>
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: colors.accentStrong,
                  marginBottom: space.sm,
                }}
              >
                {chapter}
              </Text>
              {items.map((m, i) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  profile={profile}
                  achievedAt={records[m.id]?.achievedAt}
                  isLast={i === items.length - 1}
                  onPress={() => (records[m.id] ? onPressAchieved(m) : setMarking(m))}
                />
              ))}
            </View>
          );
        })}

      <MarkSheet
        milestone={marking}
        profile={profile}
        onCancel={() => setMarking(undefined)}
        onConfirm={async (date) => {
          const m = marking!;
          setMarking(undefined);
          await markMilestone(m.id, date, false);
          celebrateAfterDismiss(m.id);
        }}
      />
    </FormScreen>
  );
}

function MilestoneRow({
  milestone,
  profile,
  achievedAt,
  isLast,
  onPress,
}: {
  milestone: MilestoneDefinition;
  profile: BabyProfile;
  achievedAt?: string;
  isLast: boolean;
  onPress: () => void;
}) {
  const achieved = Boolean(achievedAt);
  const subtitle = achievedAt
    ? `${formatDate(achievedAt)} · day ${daysSinceBirth(profile, new Date(achievedAt))}`
    : milestone.hint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${milestone.title}, ${achieved ? `achieved ${subtitle}` : `not yet. ${milestone.hint}`}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', gap: space.md, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: NODE, alignItems: 'center' }}>
        <View
          style={{
            width: NODE,
            height: NODE,
            borderRadius: NODE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: achieved ? colors.accent : 'transparent',
            borderWidth: 1,
            borderColor: achieved ? colors.accent : colors.ring,
          }}
        >
          <Ionicons
            name={achieved ? 'checkmark' : milestone.icon}
            size={achieved ? 16 : 14}
            color={achieved ? colors.surface : colors.muted}
          />
        </View>
        {!isLast && (
          <View
            style={{
              flex: 1,
              width: 1,
              minHeight: 16,
              backgroundColor: achieved ? colors.accent : colors.line,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1, paddingTop: 4, paddingBottom: isLast ? 0 : space.lg }}>
        <Text
          style={{
            fontSize: type.body,
            fontFamily: achieved ? type.fontBodyMedium : type.fontBody,
            color: achieved ? colors.text : colors.muted,
          }}
        >
          {milestone.title}
        </Text>
        <Text style={{ fontSize: type.caption, color: achieved ? colors.accentStrong : colors.faint, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <View style={{ paddingTop: 4 }}>
        {achieved ? (
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
        ) : milestone.auto ? (
          <Text style={{ fontSize: 10, color: colors.faint, letterSpacing: 0.6 }}>AUTO</Text>
        ) : (
          <Text style={{ fontSize: 11, color: colors.accentStrong }}>Mark</Text>
        )}
      </View>
    </Pressable>
  );
}

function MarkSheet({
  milestone,
  profile,
  onCancel,
  onConfirm,
}: {
  milestone?: MilestoneDefinition;
  profile: BabyProfile;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}) {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    if (milestone) setDate(new Date());
  }, [milestone]);

  const birth = new Date(profile.dateOfBirth);
  const clamp = (d: Date) => {
    const now = new Date();
    if (d > now) return now;
    if (d < birth) return birth;
    return d;
  };

  // The backdrop dim and the sheet are siblings inside the same Modal, so
  // RN's built-in "slide" animationType slides both together — the dim
  // visibly travels up from the bottom instead of just fading in. Animate
  // them separately instead: backdrop fades, sheet slides.
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!milestone) return;
    backdrop.setValue(0);
    sheet.setValue(0);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(sheet, { toValue: 1, friction: 9, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [milestone, backdrop, sheet]);

  return (
    <Modal visible={Boolean(milestone)} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View
        style={{ flex: 1, backgroundColor: 'rgba(32,31,29,0.35)', opacity: backdrop }}
      >
        <Pressable accessibilityLabel="Close" onPress={onCancel} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.lg * 2,
          borderTopRightRadius: radius.lg * 2,
          padding: space.xl,
          paddingBottom: insets.bottom + space.xl,
          gap: space.lg,
          transform: [
            { translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          ],
        }}
      >
        {milestone && (
          <>
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <Ionicons name={milestone.icon} size={28} color={colors.accent} />
              <Text style={{ fontFamily: type.fontHeading, fontSize: 24, color: colors.text, textAlign: 'center' }}>
                {milestone.title}
              </Text>
              <Text style={{ color: colors.muted, fontSize: type.caption, textAlign: 'center' }}>
                {milestone.hint}
              </Text>
            </View>
            <DatePicker label="When did it happen?" value={date} onChange={(d) => setDate(clamp(d))} />
            <Button onPress={() => onConfirm(clamp(date))}>Celebrate</Button>
            <Button variant="secondary" onPress={onCancel}>
              Not yet
            </Button>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
