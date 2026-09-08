import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { listBabies } from '@/lib/api/babies';
import { saveProfile } from '@/lib/offline/database';
import { setServerBabyId } from '@/lib/offline/serverBaby';

export default function Index() {
  const { session, loading } = useAuthSession();
  const [target, setTarget] = useState<string>();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setTarget('/onboarding');
      return;
    }

    let active = true;
    (async () => {
      // Reconcile this device with whatever the account already has on the
      // server (e.g. signed in on a second device, or after a reinstall).
      // Local storage always stays keyed by the fixed LOCAL_BABY_ID (every
      // screen in this single-baby-per-device MVP expects that) — only the
      // server-side id is remembered separately, for API calls.
      try {
        const babies = await listBabies();
        if (!active) return;
        if (babies.length > 0) {
          const serverBaby = babies[0];
          await setServerBabyId(serverBaby.id);
          await saveProfile(LOCAL_BABY_ID, JSON.stringify({ ...serverBaby, id: LOCAL_BABY_ID }));
          setTarget('/(tabs)/home');
        } else {
          setTarget('/baby-setup');
        }
      } catch {
        // Offline or server unreachable — fall back to local state so the
        // app still opens; the sync engine will reconcile once connectivity
        // returns.
        if (!active) return;
        const local = await loadBabyProfile(LOCAL_BABY_ID);
        setTarget(local ? '/(tabs)/home' : '/baby-setup');
      }
    })();
    return () => {
      active = false;
    };
  }, [session, loading]);

  if (!target) return null;
  return <Redirect href={target as any} />;
}
