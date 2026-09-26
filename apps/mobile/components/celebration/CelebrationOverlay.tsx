import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoBlurToggle } from '@/components/domain/PhotoBlurToggle';
import { BabyProfile } from '@/features/baby-profile/types';
import { usePhotoBlur } from '@/features/privacy/PhotoBlurContext';
import { milestoneSounds } from '@/features/milestones/sounds';
import { daysSinceBirth, MilestoneDefinition, pronounsFor } from '@/features/milestones/types';
import { colors, space, type } from '@/lib/design-system/tokens';
import { formatMeasurement } from '@/lib/format';
import { Confetti } from './Confetti';

// Tinted by the baby's sex like the rest of the app (Screen.tsx), always
// threaded with the gold accent so it reads as the same design system.
const palettes = {
  girl: {
    confetti: ['#e3a19b', '#f2c9c0', '#b68235', '#dcb46c', '#f7e6d4', '#c9807a'],
    ground: ['#f4b3a3', '#f8d9cc', '#faf8f6'] as const,
  },
  boy: {
    confetti: ['#8fb2d8', '#c4d8ed', '#b68235', '#dcb46c', '#f7e6d4', '#6f93bd'],
    ground: ['#a9cbee', '#d6e6f5', '#faf8f6'] as const,
  },
} as const;

export function CelebrationOverlay({
  milestone,
  profile,
  photoUrl,
  achievedAt,
  onClose,
}: {
  milestone: MilestoneDefinition;
  profile: BabyProfile;
  photoUrl?: string;
  achievedAt: Date;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { blurred } = usePhotoBlur();
  const palette = palettes[profile.sex] ?? palettes.girl;
  const grand = Boolean(milestone.grand);
  const name = profile.name || 'Your baby';
  const headline = milestone.headline(name);
  const message = milestone.message(pronounsFor(profile), { profile, achievedAt });

  const [reduceMotion, setReduceMotion] = useState(false);
  const backdrop = useRef(new Animated.Value(0)).current;
  const medallion = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const player = createAudioPlayer(milestoneSounds[milestone.id]);
    player.play();
    return () => player.release();
  }, [milestone.id]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    AccessibilityInfo.announceForAccessibility(`${headline}. ${message}`);
    // Backdrop, then the medallion springs in with the words following close
    // behind (not waiting for the spring to fully settle).
    Animated.sequence([
      Animated.timing(backdrop, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(medallion, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(content, {
          toValue: 1,
          duration: 520,
          delay: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    const pulse = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    pulse.start();
    return () => pulse.stop();
  }, [backdrop, medallion, content, halo, headline, message]);

  const medallionSize = grand ? 150 : 124;
  const initial = name.trim()[0]?.toUpperCase() ?? '♥';
  const dateLabel = achievedAt.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const contentStyle = {
    opacity: content,
    transform: [{ translateY: content.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, opacity: backdrop }} accessibilityViewIsModal>
        <LinearGradient
          colors={palette.ground}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          {!reduceMotion && (
            <Confetti palette={palette.confetti} count={grand ? 90 : 46} waves={grand ? 3 : 1} />
          )}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.xl,
              paddingTop: insets.top + space.lg,
              paddingBottom: insets.bottom + space.lg,
              gap: space.lg,
            }}
          >
            <Animated.View
              style={{
                width: medallionSize + 36,
                height: medallionSize + 36,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: medallion.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                opacity: medallion,
              }}
            >
              {!reduceMotion && (
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: medallionSize + 36,
                    height: medallionSize + 36,
                    borderRadius: (medallionSize + 36) / 2,
                    borderWidth: 1,
                    borderColor: colors.accent,
                    opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                    transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.12] }) }],
                  }}
                />
              )}
              <View
                style={{
                  width: medallionSize + 14,
                  height: medallionSize + 14,
                  borderRadius: (medallionSize + 14) / 2,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: medallionSize,
                    height: medallionSize,
                    borderRadius: medallionSize / 2,
                    overflow: 'hidden',
                    backgroundColor: colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      blurRadius={blurred ? 22 : 0}
                      style={{ width: medallionSize, height: medallionSize }}
                      accessibilityLabel={`${name}'s photo`}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: type.fontHeading,
                        fontSize: medallionSize * 0.42,
                        color: colors.accentStrong,
                      }}
                    >
                      {initial}
                    </Text>
                  )}
                </View>
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 14,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.accent,
                  borderWidth: 3,
                  borderColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={milestone.icon} size={19} color={colors.surface} />
              </View>
              {photoUrl && (
                <PhotoBlurToggle size={32} style={{ position: 'absolute', top: 10, right: 10 }} />
              )}
            </Animated.View>

            <Animated.View style={[{ alignItems: 'center', gap: space.md, maxWidth: 360 }, contentStyle]}>
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 2.4,
                  textTransform: 'uppercase',
                  color: colors.accentStrong,
                  fontFamily: type.fontBodyMedium,
                }}
              >
                {grand ? 'Going home' : `A milestone · ${milestone.chapter}`}
              </Text>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: type.fontHeading,
                  fontSize: grand ? 40 : 33,
                  lineHeight: grand ? 44 : 37,
                  color: colors.text,
                  textAlign: 'center',
                }}
              >
                {headline}
              </Text>
              <Flourish />
              <Text
                style={{
                  fontFamily: type.fontBody,
                  fontSize: type.body,
                  lineHeight: 23,
                  color: colors.muted,
                  textAlign: 'center',
                }}
              >
                {message}
              </Text>
              {grand && (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: space.sm,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: colors.divider,
                    paddingVertical: space.md,
                    alignSelf: 'stretch',
                  }}
                >
                  <Stat value={String(daysSinceBirth(profile, achievedAt))} label="Days in hospital" />
                  <Stat value={`${profile.gestationalWeeks}w ${profile.gestationalDays}d`} label="Born at" divider />
                  <Stat value={`${formatMeasurement(profile.birthWeightKg)} kg`} label="Birth weight" divider />
                </View>
              )}
              <Text style={{ fontSize: type.caption, color: colors.faint, fontFamily: type.fontBody }}>
                {dateLabel}
              </Text>
            </Animated.View>

            <Animated.View style={[{ alignSelf: 'stretch', alignItems: 'center' }, contentStyle]}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => ({
                  minHeight: 48,
                  minWidth: 220,
                  paddingHorizontal: space.xl,
                  borderRadius: 999,
                  backgroundColor: pressed ? colors.accentStrong : colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text style={{ color: colors.surface, fontFamily: type.fontHeading, fontSize: 18 }}>
                  {grand ? 'Welcome home' : 'Treasure this moment'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

// Hairline — diamond — hairline, the editorial divider under the headline.
function Flourish() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 36, height: 1, backgroundColor: colors.accent }} />
      <View style={{ width: 6, height: 6, backgroundColor: colors.accent, transform: [{ rotate: '45deg' }] }} />
      <View style={{ width: 36, height: 1, backgroundColor: colors.accent }} />
    </View>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 2,
        borderLeftWidth: divider ? 1 : 0,
        borderLeftColor: colors.divider,
      }}
    >
      <Text style={{ fontFamily: type.fontHeading, fontSize: 22, color: colors.text }}>{value}</Text>
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
