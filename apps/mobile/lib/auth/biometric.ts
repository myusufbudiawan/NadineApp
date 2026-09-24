import * as LocalAuthentication from 'expo-local-authentication';
import { isUnlockedThisLaunch, markUnlockedThisLaunch } from './unlockState';

// Gates app open with Face ID/Touch ID/device passcode when the hardware
// supports it and the user has something enrolled — otherwise there's
// nothing to prompt, so treat the device as unlocked rather than blocking
// people who haven't set up biometrics.
export async function canUseBiometricLock(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

export async function unlockWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock PreemieTrack',
    disableDeviceFallback: false,
  });
  return result.success;
}

let inFlightUnlock: Promise<boolean> | undefined;

// The launch gate app/index.tsx awaits. Shares one in-flight prompt between
// concurrent callers: on launch, useAuthSession emits the restored session
// twice (getSession(), then onAuthStateChange's INITIAL_SESSION /
// TOKEN_REFRESHED), which re-runs index.tsx's effect while the first Face ID
// sheet is still up — without this, the second run would show a second
// prompt right after the first succeeded.
export function ensureUnlockedThisLaunch(): Promise<boolean> {
  if (isUnlockedThisLaunch()) return Promise.resolve(true);
  inFlightUnlock ??= (async () => {
    try {
      const unlocked = !(await canUseBiometricLock()) || (await unlockWithBiometrics());
      if (unlocked) markUnlockedThisLaunch();
      return unlocked;
    } finally {
      inFlightUnlock = undefined;
    }
  })();
  return inFlightUnlock;
}
