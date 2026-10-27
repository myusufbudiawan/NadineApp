import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import appConfig, { WORK_MANAGER_KEEP_RULES } from '../app.config.ts';

const { expo } = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const androidBuildProperties = (env: Record<string, string | undefined>) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  try {
    const plugins = appConfig({ config: expo } as never).plugins ?? [];
    const entry = plugins.find((p) => Array.isArray(p) && p[0] === 'expo-build-properties') as [string, any];
    return entry[1].android;
  } finally {
    process.env = saved;
  }
};

// Every Android build keeps the WorkManager/Room constructors R8 would strip
// (release APKs crashed on launch without them), alongside app.json's options.
for (const env of [{}, { ANDROID_ARM64_ONLY: '1' }, { ANDROID_ARM64_ONLY: '1', EXPO_PUBLIC_OFFLINE_ONLY: '1' }]) {
  const android = androidBuildProperties(env);
  assert.equal(android.extraProguardRules, WORK_MANAGER_KEEP_RULES);
  assert.equal(android.enableMinifyInReleaseBuilds, true);
}
assert.match(WORK_MANAGER_KEEP_RULES, /androidx\.room\.RoomDatabase \{ <init>\(\); \}/);
assert.match(WORK_MANAGER_KEEP_RULES, /androidx\.work\.InputMerger \{ <init>\(\); \}/);

// The arm64-only switch still applies on top.
assert.deepEqual(androidBuildProperties({ ANDROID_ARM64_ONLY: '1' }).buildArchs, ['arm64-v8a']);
assert.equal(androidBuildProperties({}).buildArchs, undefined);

console.log('appConfig tests passed');
