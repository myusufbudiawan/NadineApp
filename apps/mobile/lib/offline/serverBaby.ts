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

export async function clearServerBabyId(): Promise<void> {
  await secureStoreAdapter.removeItem(KEY);
}

// All local tables (baby_profiles, care_events, growth_measurements, ...)
// are single-account-per-device — none of them are keyed by user id. This
// remembers which account's data currently occupies this device's local
// storage, so app startup (app/index.tsx) can tell "safe to offline-open
// from cache" (same account as last sync) apart from "a different account
// signed in on this device" (must wipe local data first, never trust it).
const OWNER_KEY = 'preemietrack.localDataOwnerId';

export async function getLocalDataOwner(): Promise<string | undefined> {
  const value = await secureStoreAdapter.getItem(OWNER_KEY);
  return value ?? undefined;
}

export async function setLocalDataOwner(userId: string): Promise<void> {
  await secureStoreAdapter.setItem(OWNER_KEY, userId);
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
