import { secureStoreAdapter } from '@/lib/auth/session';

// Client-only preference (mirrors features/dashboard/preferences.ts) — a
// privacy setting for whoever's holding the phone, not something that
// belongs on the server or synced across caregivers' devices.
const KEY = 'preemietrack.babyPhotoBlurred';

export async function loadPhotoBlurred(): Promise<boolean> {
  const raw = await secureStoreAdapter.getItem(KEY);
  return raw === '1';
}

export async function savePhotoBlurred(blurred: boolean): Promise<void> {
  await secureStoreAdapter.setItem(KEY, blurred ? '1' : '0');
}
