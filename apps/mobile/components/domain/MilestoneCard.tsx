import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BabyProfile } from '@/features/baby-profile/types';
import { MilestoneRecords } from '@/features/milestones/storage';
import { milestonesFor } from '@/features/milestones/types';
import { colors, radius, space, type } from '@/lib/design-system/tokens';

const DAY = 86_400_000;

function relativeDay(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Home's quiet doorway into the milestones journey: the most recent
// milestone (or an invitation, before the first), plus how far along the
// journey is as a row of small gold beads.
export function MilestoneCard({
  profile,
  records,
  onPress,
}: {
  profile: BabyProfile;
  records: MilestoneRecords;
  onPress: () => void;
}) {
  const all = milestonesFor(profile);
  const achieved = all
    .filter((m) => records[m.id])
    .sort((a, b) => records[b.id]!.achievedAt.localeCompare(records[a.id]!.achievedAt));
  const latest = achieved[0];
  const name = profile.name || 'your baby';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        latest
          ? `Milestones. Latest: ${latest.title}, ${relativeDay(records[latest.id]!.achievedAt)}. ${achieved.length} of ${all.length}.`
          : 'Milestones. Celebrate every step of the journey.'
      }
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        padding: space.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: pressed ? colors.accentSoft : colors.surface,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          borderWidth: 1,
          borderColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: latest ? colors.accent : 'transparent',
        }}
      >
        <Ionicons
          name={latest ? latest.icon : 'ribbon-outline'}
          size={20}
          color={latest ? colors.surface : colors.accent}
        />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.accentStrong }}>
          {latest ? `Latest milestone · ${relativeDay(records[latest.id]!.achievedAt)}` : 'Milestones'}
        </Text>
        <Text style={{ fontFamily: type.fontHeading, fontSize: 18, color: colors.text }}>
          {latest ? latest.title : `Celebrate every step with ${name}`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
          {all.map((m) => (
            <View
              key={m.id}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: records[m.id] ? colors.accent : colors.line,
              }}
            />
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}
