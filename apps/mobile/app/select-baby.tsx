import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FormScreen } from '@/components/ui/Screen';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import { ServerBaby, listBabies } from '@/lib/api/babies';
import { resetLocalData, saveProfile } from '@/lib/offline/database';
import { hydrateFromServer } from '@/lib/offline/hydrate';
import { getServerBabyId, setLocalDataOwner, setServerBabyId } from '@/lib/offline/serverBaby';
import { supabase } from '@/lib/supabase/client';

// Reached from app/index.tsx when an account can see more than one baby
// (owns one and/or has been shared others) — this device still only shows
// one baby at a time (MVP single-baby-per-device), so this just decides
// which one, and doubles as a "Switch Baby" destination from More later.
export default function SelectBaby() {
  const [babies, setBabies] = useState<ServerBaby[]>();
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    listBabies().then(setBabies);
  }, []);

  const choose = async (baby: ServerBaby) => {
    if (switching) return;
    setSwitching(true);
    try {
      const current = await getServerBabyId();
      if (current !== baby.id) {
        // Local tables are single-baby-per-device — wipe before rehydrating
        // so the previous baby's cached events/measurements never bleed in.
        await resetLocalData();
      }
      await setServerBabyId(baby.id);
      await saveProfile(LOCAL_BABY_ID, JSON.stringify({ ...baby, id: LOCAL_BABY_ID }));
      await hydrateFromServer(baby.id);
      const { data } = await supabase.auth.getSession();
      if (data.session) await setLocalDataOwner(data.session.user.id);
      router.replace('/(tabs)/home');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <FormScreen>
      <ScreenHeader title="Choose a baby" />
      <Text style={{ color: colors.muted, fontSize: type.label, lineHeight: 20 }}>
        This account can see more than one baby. Pick which one to show on
        this device.
      </Text>
      {!babies ? (
        <ActivityIndicator />
      ) : (
        babies.map((baby) => (
          <Pressable
            key={baby.id}
            disabled={switching}
            accessibilityRole="button"
            accessibilityLabel={`${baby.name}${baby.isOwner ? '' : ', shared with you'}`}
            onPress={() => choose(baby)}
            style={{
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.sm,
              padding: space.md,
              backgroundColor: colors.white,
              opacity: switching ? 0.6 : 1,
            }}
          >
            <Text style={{ fontFamily: type.fontBodyMedium, fontSize: type.body, color: colors.text }}>
              {baby.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: type.caption, marginTop: 3 }}>
              {baby.isOwner ? 'Your baby' : 'Shared with you'}
            </Text>
          </Pressable>
        ))
      )}
    </FormScreen>
  );
}
