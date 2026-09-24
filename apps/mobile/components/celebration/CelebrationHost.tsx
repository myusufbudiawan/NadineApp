import { useEffect, useState } from 'react';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { BabyProfile } from '@/features/baby-profile/types';
import { useBabyPhotoUrl } from '@/features/baby-profile/useBabyPhotoUrl';
import { finishCelebration, subscribeToCelebrations } from '@/features/milestones/celebrate';
import { loadMilestones, markCelebrated } from '@/features/milestones/storage';
import { milestoneById, MilestoneId } from '@/features/milestones/types';
import { CelebrationOverlay } from './CelebrationOverlay';

type Active = { id: MilestoneId; profile: BabyProfile; achievedAt: Date };

// Mounted once at the app root (app/_layout.tsx) so a celebration plays over
// whatever screen is showing — plays queued milestones one at a time.
export function CelebrationHost() {
  const [queue, setQueue] = useState<MilestoneId[]>([]);
  const [active, setActive] = useState<Active>();
  const photoUrl = useBabyPhotoUrl(active?.profile.photoUri);

  useEffect(() => subscribeToCelebrations(setQueue), []);

  const next = queue[0];
  useEffect(() => {
    if (!next) {
      setActive(undefined);
      return;
    }
    let cancelled = false;
    Promise.all([loadBabyProfile(LOCAL_BABY_ID), loadMilestones()])
      .then(([profile, records]) => {
        if (cancelled) return;
        if (!profile) {
          finishCelebration(next);
          return;
        }
        const record = records[next];
        setActive({
          id: next,
          profile,
          achievedAt: record ? new Date(record.achievedAt) : new Date(),
        });
      })
      .catch((err) => {
        console.warn('celebration: failed to load profile', err);
        finishCelebration(next);
      });
    return () => {
      cancelled = true;
    };
  }, [next]);

  if (!active || active.id !== next) return null;
  return (
    <CelebrationOverlay
      key={active.id}
      milestone={milestoneById[active.id]}
      profile={active.profile}
      photoUrl={photoUrl}
      achievedAt={active.achievedAt}
      onClose={() => {
        markCelebrated(active.id).catch(() => {});
        finishCelebration(active.id);
      }}
    />
  );
}
