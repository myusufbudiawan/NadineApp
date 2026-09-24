import { Ionicons } from '@expo/vector-icons';
import { BabyProfile } from '@/features/baby-profile/types';

export type MilestoneId =
  | 'off-cpap'
  | 'off-high-flow'
  | 'room-air'
  | 'first-cuddle'
  | 'first-oral-feed'
  | 'full-oral-feeds'
  | 'term-feeding-volume'
  | 'regained-birth-weight'
  | 'two-kilos'
  | 'open-cot'
  | 'reached-due-date'
  | 'discharged';

export type MilestoneChapter = 'Breathing' | 'Feeding' | 'Growing' | 'Comfort' | 'Going home';

export type MilestoneRecord = { achievedAt: string; celebrated: boolean };

export type MilestoneContext = {
  profile: BabyProfile;
  achievedAt: Date;
};

export type MilestoneDefinition = {
  id: MilestoneId;
  chapter: MilestoneChapter;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Shown under a milestone that hasn't happened yet. */
  hint: string;
  /**
   * Detected from logged data (weights, feeds, kangaroo sessions, age), so
   * it's celebrated the moment the app notices — still markable by hand for
   * anything that happened before it was tracked here.
   */
  auto?: boolean;
  /** Hidden when it can't apply to this baby (e.g. 2 kg for a baby born above it). */
  appliesTo?: (profile: BabyProfile) => boolean;
  /** Discharge gets the full-screen homecoming; everything else a lighter one. */
  grand?: boolean;
  headline: (name: string) => string;
  message: (p: Pronouns, ctx: MilestoneContext) => string;
};

export type Pronouns = { subject: string; object: string; possessive: string };

export function pronounsFor(profile: BabyProfile): Pronouns {
  return profile.sex === 'boy'
    ? { subject: 'he', object: 'him', possessive: 'his' }
    : { subject: 'she', object: 'her', possessive: 'her' };
}

const DAY = 86_400_000;
export function daysSinceBirth(profile: BabyProfile, at: Date) {
  return Math.max(0, Math.round((at.getTime() - new Date(profile.dateOfBirth).getTime()) / DAY));
}

export const milestoneChapters: MilestoneChapter[] = [
  'Breathing',
  'Feeding',
  'Growing',
  'Comfort',
  'Going home',
];

export const milestoneDefinitions: MilestoneDefinition[] = [
  {
    id: 'off-cpap',
    chapter: 'Breathing',
    icon: 'cloud-outline',
    title: 'Off CPAP',
    hint: 'Breathing without CPAP support',
    headline: (name) => `${name} is off CPAP`,
    message: (p) =>
      `No more CPAP — ${p.subject} is doing more of the breathing on ${p.possessive} own. A big, brave step.`,
  },
  {
    id: 'off-high-flow',
    chapter: 'Breathing',
    icon: 'leaf-outline',
    title: 'Off high flow',
    hint: 'Weaned from high-flow oxygen',
    headline: (name) => `${name} is off high flow`,
    message: (p) =>
      `High flow is behind ${p.object}. Each breath is a little stronger than the one before.`,
  },
  {
    id: 'room-air',
    chapter: 'Breathing',
    icon: 'sunny-outline',
    title: 'Breathing room air',
    hint: 'Off low-flow oxygen — no support at all',
    headline: (name) => `${name} is breathing room air`,
    message: (p) =>
      `No tubes, no oxygen — just ${p.object}, breathing the same air as you. Take a deep breath together.`,
  },
  {
    id: 'first-oral-feed',
    chapter: 'Feeding',
    icon: 'water-outline',
    title: 'First feed by mouth',
    hint: 'First bottle or breastfeed',
    headline: (name) => `${name}'s first feed by mouth`,
    message: (p) =>
      `Suck, swallow, breathe — ${p.subject} put it all together. A skill that takes real work for a little one.`,
  },
  {
    id: 'full-oral-feeds',
    chapter: 'Feeding',
    icon: 'cafe-outline',
    title: 'All feeds by mouth',
    hint: 'Feeding tube no longer needed',
    headline: (name) => `${name} is off the feeding tube`,
    message: (p) =>
      `Every feed by mouth now. ${capitalize(p.subject)}'s doing it all by ${p.object}self — well, with you.`,
  },
  {
    id: 'term-feeding-volume',
    chapter: 'Feeding',
    icon: 'ribbon-outline',
    title: 'Drinking like a full-term baby',
    hint: 'About 150 ml per kg over a day — detected from logged feeds',
    auto: true,
    headline: (name) => `${name} is drinking like a full-term baby`,
    message: (p) =>
      `Around 150 ml for every kilo in a day — the same as a baby born at term. ${capitalize(p.subject)} is fuelling ${p.possessive} own growing.`,
  },
  {
    id: 'regained-birth-weight',
    chapter: 'Growing',
    icon: 'trending-up-outline',
    title: 'Back to birth weight',
    hint: 'Detected from logged weights',
    auto: true,
    headline: (name) => `${name} is back to birth weight`,
    message: (p, { profile, achievedAt }) =>
      `Every early gram lost is back, ${daysSinceBirth(profile, achievedAt)} days in. From here, ${p.subject} only grows.`,
  },
  {
    id: 'two-kilos',
    chapter: 'Growing',
    icon: 'barbell-outline',
    title: 'Reached 2 kg',
    hint: 'Detected from logged weights',
    auto: true,
    appliesTo: (profile) => profile.birthWeightKg < 2,
    headline: (name) => `${name} weighs 2 kilos`,
    message: (p, { profile }) =>
      `From ${profile.birthWeightKg.toFixed(2)} kg to 2 kg — ${p.subject} has grown so much, one gram at a time.`,
  },
  {
    id: 'first-cuddle',
    chapter: 'Comfort',
    icon: 'heart-outline',
    title: 'First kangaroo cuddle',
    hint: 'Detected from logged kangaroo care',
    auto: true,
    headline: (name) => `${name}'s first kangaroo cuddle`,
    message: (p) =>
      `Skin to skin, heartbeat to heartbeat. ${capitalize(p.subject)} knows exactly where ${p.subject} belongs.`,
  },
  {
    id: 'open-cot',
    chapter: 'Comfort',
    icon: 'bed-outline',
    title: 'Out of the incubator',
    hint: 'Keeping warm in an open cot',
    headline: (name) => `${name} is out of the incubator`,
    message: (p) =>
      `Warm enough on ${p.possessive} own in an open cot — no more reaching through portholes to hold ${p.object}.`,
  },
  {
    id: 'reached-due-date',
    chapter: 'Growing',
    icon: 'calendar-outline',
    title: 'Reached due date',
    hint: 'Corrected age zero — detected automatically',
    auto: true,
    appliesTo: (profile) =>
      profile.gestationalWeeks * 7 + profile.gestationalDays < profile.fullTermReferenceWeeks * 7,
    headline: (name) => `Happy due date, ${name}`,
    message: (p, { profile }) =>
      `Born at ${profile.gestationalWeeks} weeks, ${p.subject} has made it all the way to the day ${p.subject} was expected. Corrected age: zero. Strength: immeasurable.`,
  },
  {
    id: 'discharged',
    chapter: 'Going home',
    icon: 'home-outline',
    title: 'Going home',
    hint: 'Discharged from the hospital',
    grand: true,
    headline: (name) => `Welcome home, ${name}`,
    message: (p, { profile, achievedAt }) =>
      `${daysSinceBirth(profile, achievedAt)} days of fighting, growing and being loved — and now ${p.subject}'s home, where ${p.subject} belongs.`,
  },
];

export const milestoneById = Object.fromEntries(
  milestoneDefinitions.map((m) => [m.id, m]),
) as Record<MilestoneId, MilestoneDefinition>;

export function milestonesFor(profile: BabyProfile) {
  return milestoneDefinitions.filter((m) => !m.appliesTo || m.appliesTo(profile));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
