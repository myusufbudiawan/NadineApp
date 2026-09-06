import { getProfile } from '@/lib/offline/database';
import { BabyProfile } from './types';

export async function loadBabyProfile(id: string): Promise<BabyProfile | undefined> {
  const payload = await getProfile(id);
  if (!payload) return undefined;
  return JSON.parse(payload) as BabyProfile;
}
