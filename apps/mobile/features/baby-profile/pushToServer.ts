import * as Crypto from 'expo-crypto';
import { createBaby, updateBaby } from '@/lib/api/babies';
import { queueMutation } from '@/lib/offline/database';
import { getServerBabyId, setServerBabyId } from '@/lib/offline/serverBaby';
import { BabyProfile } from './types';

// Shared by baby-setup.tsx (full profile edits) and home.tsx (photo picker):
// push straight to the server, falling back to the same mutation_queue/backoff
// sync.ts uses for care events if that fails.
export async function pushBabyProfile(profile: BabyProfile): Promise<void> {
  const { id: _localId, ...payload } = profile;
  try {
    const existingServerId = await getServerBabyId();
    if (existingServerId) {
      await updateBaby(existingServerId, payload);
    } else {
      const created = await createBaby(payload);
      await setServerBabyId(created.id);
    }
  } catch (err) {
    console.warn('baby-profile: server save failed, queued for retry', err);
    await queueMutation(Crypto.randomUUID(), 'baby-profile', JSON.stringify(payload));
    throw err;
  }
}
