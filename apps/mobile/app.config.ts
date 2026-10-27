import type { ConfigContext, ExpoConfig } from 'expo/config';

type PluginEntry = NonNullable<ExpoConfig['plugins']>[number];

function withAndroidBuildProperties(plugins: PluginEntry[] = [], android: object): PluginEntry[] {
  return plugins.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
    const options = plugin[1] ?? {};
    return [plugin[0], { ...options, android: { ...options.android, ...android } }];
  });
}

// SDK 58 release builds run R8 in full mode, which strips the no-arg
// constructors WorkManager (pulled in by react-native-android-widget)
// instantiates by reflection at app start — every release APK crashed on
// launch while Expo Go (no R8, no widget module) was fine. Upstream:
// sAleksovski/react-native-android-widget#159, expo/expo#51337.
// ponytail: drop once the widget library ships these as consumer rules.
export const WORK_MANAGER_KEEP_RULES = [
  '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
  '-keep class * extends androidx.work.InputMerger { <init>(); }',
].join('\n');

export default ({ config }: ConfigContext): ExpoConfig => {
  let result = {
    ...config,
    slug: config.slug!,
    name: config.name!,
    plugins: withAndroidBuildProperties(config.plugins, { extraProguardRules: WORK_MANAGER_KEEP_RULES }),
  };
  // Sideloaded APKs (eas.json *preview profiles) are universal — every ABI's
  // native libs in one file, which pushed them past 100 MB. Every Android phone
  // from the last ~8 years is arm64, so those builds ship arm64 only. Store
  // builds (AAB) keep all ABIs; Play splits them per device anyway.
  if (process.env.ANDROID_ARM64_ONLY === '1') {
    result = { ...result, plugins: withAndroidBuildProperties(result.plugins, { buildArchs: ['arm64-v8a'] }) };
  }
  // The offline-only build (eas.json offline-* profiles) is the same codebase
  // with every server path switched off (lib/offlineOnly.ts). It gets its own
  // app id so it installs side-by-side with the cloud app and never shares its
  // sandbox (SQLite, SecureStore) with it.
  if (process.env.EXPO_PUBLIC_OFFLINE_ONLY === '1') {
    const id = 'com.anonymous.preemietrack.offline';
    result = {
      ...result,
      name: 'PreemieTrack Private',
      scheme: 'preemietrack-offline',
      ios: { ...result.ios, bundleIdentifier: id },
      android: { ...result.android, package: id },
    };
  }
  return result;
};
