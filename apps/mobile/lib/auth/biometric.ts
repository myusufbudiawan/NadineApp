import * as LocalAuthentication from 'expo-local-authentication';

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
