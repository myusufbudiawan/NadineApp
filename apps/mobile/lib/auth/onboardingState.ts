import { secureStoreAdapter } from '@/lib/auth/session';

// Set once the user taps past the onboarding screen (Get started / I
// already have an account) so app/index.tsx never routes back to it on this
// device — even after signing out, a session expiring, or an abandoned
// signup. Persisted (unlike unlockState.ts, which is per-launch only).
const KEY = 'preemietrack.onboarded';

export async function hasOnboarded(): Promise<boolean> {
  return (await secureStoreAdapter.getItem(KEY)) === '1';
}

export async function markOnboarded(): Promise<void> {
  await secureStoreAdapter.setItem(KEY, '1');
}
