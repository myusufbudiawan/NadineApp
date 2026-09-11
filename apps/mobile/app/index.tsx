import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Button } from '@/components/ui/Button';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { loadBabyProfile } from '@/features/baby-profile/storage';
import { listBabies } from '@/lib/api/babies';
import { canUseBiometricLock, unlockWithBiometrics } from '@/lib/auth/biometric';
import { hasOnboarded } from '@/lib/auth/onboardingState';
import { isUnlockedThisLaunch, markUnlockedThisLaunch } from '@/lib/auth/unlockState';
import { colors, space, type } from '@/lib/design-system/tokens';
import { resetLocalData, saveProfile } from '@/lib/offline/database';
import { hydrateFromServer } from '@/lib/offline/hydrate';
import {
  clearServerBabyId,
  getLocalDataOwner,
  setLocalDataOwner,
  setServerBabyId,
} from '@/lib/offline/serverBaby';

export default function Index() {
  const { session, loading } = useAuthSession();
  const [target, setTarget] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      hasOnboarded().then((onboarded) => {
        setTarget(onboarded ? '/login' : '/onboarding');
      });
      return;
    }

    const accountId = session.user.id;
    let active = true;
    setFailed(false);
    (async () => {
      // The Supabase session persists across app opens (no re-login needed
      // — see lib/supabase/client.ts's persistSession config) — Face
      // ID/Touch ID/passcode gates *this device* re-opening it, without
      // asking for the password again. Skipped when nothing's enrolled
      // (never blocks those devices), and skipped when identity was already
      // proven this launch (a password sign-in just now, or an earlier
      // pass through here) so it never stacks right after typing a
      // password — see lib/auth/unlockState.ts.
      if (!isUnlockedThisLaunch() && (await canUseBiometricLock())) {
        const unlocked = await unlockWithBiometrics();
        if (!active) return;
        if (!unlocked) {
          // Cancelled or failed — re-prompt immediately rather than parking
          // on a dead-end screen; the native prompt already offers its own
          // Cancel/passcode affordances.
          setAttempt((n) => n + 1);
          return;
        }
      }
      markUnlockedThisLaunch();

      // Reconcile this device with whatever the account already has on the
      // server (e.g. signed in on a second device, or after a reinstall).
      // Local storage (baby_profiles, care_events, ...) is single-account-
      // per-device, not keyed by user id — so if it currently belongs to a
      // *different* account (owner mismatch below), wipe it first rather
      // than ever let a new sign-in see a previous account's cached baby.
      let owner = await getLocalDataOwner();
      if (owner && owner !== accountId) {
        console.warn('index: local data belongs to a different account, wiping');
        await resetLocalData();
        await clearServerBabyId();
        owner = undefined;
      }
      if (!active) return;
      // First time this account's data has ever landed on this device (a
      // fresh install, or right after the wipe above) — pull its full
      // server-side history down, not just future mutations. A device this
      // account has already synced to keeps its history current via the
      // mutation queue, so this only needs to run once per device+account.
      const needsHydration = !owner;

      try {
        const babies = await listBabies();
        if (!active) return;
        if (babies.length > 1) {
          // More than one accessible baby (own + shared, e.g. Mom and Dad on
          // the same baby plus Dad's own) — let them pick which one this
          // device shows, rather than silently defaulting to babies[0].
          await setLocalDataOwner(accountId);
          setTarget('/select-baby');
        } else if (babies.length === 1) {
          // Also covers the invited-caregiver case: someone shared a baby
          // with this account and it owns none of its own — this is exactly
          // as if they'd created it themselves, no baby-setup needed.
          const serverBaby = babies[0];
          await setServerBabyId(serverBaby.id);
          await saveProfile(LOCAL_BABY_ID, JSON.stringify({ ...serverBaby, id: LOCAL_BABY_ID }));
          if (needsHydration) await hydrateFromServer(serverBaby.id);
          await setLocalDataOwner(accountId);
          setTarget('/(tabs)/home');
        } else {
          await setLocalDataOwner(accountId);
          setTarget('/baby-setup');
        }
      } catch (err) {
        console.warn('index: listBabies() failed', err);
        if (!active) return;
        // Only trust the local cache offline when we already know — from a
        // previous successful sync this session or an earlier one — that it
        // belongs to this account. Otherwise we can't tell "no baby yet"
        // from "fetch failed", so ask to retry rather than guess.
        if (owner === accountId) {
          const local = await loadBabyProfile(LOCAL_BABY_ID);
          setTarget(local ? '/(tabs)/home' : '/baby-setup');
        } else {
          setFailed(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [session, loading, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (failed) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.xl,
          gap: space.md,
        }}
      >
        <Text style={{ fontSize: type.body, color: colors.text, textAlign: 'center' }}>
          Couldn't reach the server to load your baby's profile. Check your
          connection and try again.
        </Text>
        <Button onPress={retry}>Retry</Button>
      </View>
    );
  }

  if (!target) return <ActivityIndicator style={{ flex: 1 }} />;
  return <Redirect href={target as any} />;
}
