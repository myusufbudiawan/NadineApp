import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { computeTodaySummary } from '@/features/care-events/todaySummary';
import { actualAge, correctedAge, formatAge } from '@/lib/age';
import { formatMeasurement } from '@/lib/format';
import { getBabyPhotoUrl } from '@/lib/supabase/storage';

export type BabyStatusSnapshot = {
  name: string;
  sex: BabyProfile['sex'];
  photoUrl?: string;
  ageLabel: string;
  ageSubLabel: string;
  weightLabel?: string;
  weightCaption: string;
  feedingLabel?: string;
  feedingCaption: string;
  updatedAtLabel: string;
};

// Widgets have no screen to fall back on, so this always returns *something*
// renderable — a freshly installed app with no baby yet gets placeholder
// copy rather than the task handler throwing and the widget staying blank.
export async function getBabyStatusSnapshot(): Promise<BabyStatusSnapshot> {
  const updatedAtLabel = `Updated ${new Date().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  const profile = await loadBabyProfile(LOCAL_BABY_ID).catch(() => undefined);
  if (!profile) {
    return {
      name: 'PreemieTrack',
      sex: 'girl',
      ageLabel: '—',
      ageSubLabel: 'Add your baby in the app',
      weightCaption: 'No reading yet',
      feedingCaption: 'No feeds logged',
      updatedAtLabel,
    };
  }

  const [summary, photoUrl] = await Promise.all([
    computeTodaySummary(LOCAL_BABY_ID).catch(() => undefined),
    getBabyPhotoUrl(profile.photoUri).catch(() => undefined),
  ]);

  const birthDate = new Date(profile.dateOfBirth);
  const actual = formatAge(actualAge(birthDate));
  const corrected = correctedAge(
    birthDate,
    profile.gestationalWeeks,
    profile.gestationalDays,
    profile.fullTermReferenceWeeks,
  );

  return {
    name: profile.name,
    sex: profile.sex,
    photoUrl,
    ageLabel: actual,
    ageSubLabel: `Corrected ${formatAge(corrected)}`,
    weightLabel: summary?.weight.hasAny
      ? `${formatMeasurement(summary.weight.value!)} ${summary.weight.unit}`
      : undefined,
    weightCaption: summary?.weight.deltaCaption ?? 'No reading yet',
    feedingLabel: summary?.feeding.hasAny
      ? `${summary.feeding.todayCount} feed${summary.feeding.todayCount === 1 ? '' : 's'} today`
      : undefined,
    feedingCaption:
      summary?.feeding.hasAny && summary.feeding.lastAmount != null
        ? `Last: ${summary.feeding.lastAmount} ${summary.feeding.lastUnit}`
        : 'No feeds logged',
    updatedAtLabel,
  };
}
