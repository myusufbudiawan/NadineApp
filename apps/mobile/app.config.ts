import type { ConfigContext, ExpoConfig } from 'expo/config';

type PluginEntry = NonNullable<ExpoConfig['plugins']>[number];

// Sideloaded APKs (eas.json *preview profiles) are universal — every ABI's
// native libs in one file, which pushed them past 100 MB. Every Android phone
// from the last ~8 years is arm64, so those builds ship arm64 only. Store
// builds (AAB) keep all ABIs; Play splits them per device anyway.
function withArm64Only(plugins: PluginEntry[] = []): PluginEntry[] {
  return plugins.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
    const options = plugin[1] ?? {};
    return [plugin[0], { ...options, android: { ...options.android, buildArchs: ['arm64-v8a'] } }];
  });
}

export default ({ config }: ConfigContext): ExpoConfig => {
  let result = { ...config, slug: config.slug!, name: config.name! };
  if (process.env.ANDROID_ARM64_ONLY === '1') {
    result = { ...result, plugins: withArm64Only(result.plugins) };
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
