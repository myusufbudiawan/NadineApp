import { secureStoreAdapter } from '@/lib/auth/session';

// Every local table is keyed by the fixed LOCAL_BABY_ID placeholder — that's
// baked into every screen in this MVP (single-baby-per-device), not just
// baby-setup. Re-keying local rows to the server's real UUID would break all
// of them at once, so instead this is the one place that remembers "what is
// this device's baby's real server id", used only when talking to the API
// (see lib/offline/sync.ts). Local reads/writes always stay keyed by
// LOCAL_BABY_ID.
const KEY = 'preemietrack.serverBabyId';

export async function getServerBabyId(): Promise<string | undefined> {
  const value = await secureStoreAdapter.getItem(KEY);
  return value ?? undefined;
}

export async function setServerBabyId(id: string): Promise<void> {
  await secureStoreAdapter.setItem(KEY, id);
}

export class NoServerBabyError extends Error {
  constructor() {
    super("Set up your baby's profile first.");
  }
}

// Server-mediated screens (Reports, Share Data) call this instead of using
// LOCAL_BABY_ID directly — those requests go straight to the API, not
// through the offline queue, so they need the real server id up front.
export async function requireServerBabyId(): Promise<string> {
  const id = await getServerBabyId();
  if (!id) throw new NoServerBabyError();
  return id;
}
