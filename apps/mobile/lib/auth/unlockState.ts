// In-memory only (not persisted) — tracks whether this app launch has
// already proven identity (password sign-in, or a successful biometric
// unlock), so app/index.tsx's biometric gate never re-prompts twice in the
// same launch (e.g. right after typing a password). Resets naturally on the
// next real app launch/process restart, which is exactly when a fresh
// biometric check should happen again.
let unlocked = false;

export function isUnlockedThisLaunch(): boolean {
  return unlocked;
}

export function markUnlockedThisLaunch(): void {
  unlocked = true;
}
