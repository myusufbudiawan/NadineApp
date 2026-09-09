import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { LOCAL_BABY_ID } from './constants';
import { loadBabyProfile } from './storage';
import { BabySex } from './types';

// Powers the sex-tinted screen background (Screen.tsx) — refreshed on focus
// so it picks up a change made in baby-setup without a full app restart.
export function useBabySex(): BabySex | undefined {
  const [sex, setSex] = useState<BabySex | undefined>(undefined);
  useFocusEffect(
    useCallback(() => {
      loadBabyProfile(LOCAL_BABY_ID)
        .then((profile) => setSex(profile?.sex))
        .catch(() => setSex(undefined));
    }, []),
  );
  return sex;
}
