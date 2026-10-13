import { Platform } from 'react-native';

// The web build is a public, no-backend demo (deployed to Vercel — see
// apps/mobile/vercel.json): no account, no API, data lives only in this
// browser, and a sample baby is seeded on first visit (lib/demo/seed.ts).
export const WEB_DEMO = Platform.OS === 'web';

// Build-time flag for the offline-only variant (eas.json offline-* profiles,
// app.config.ts): no account, no sync, no API/Supabase calls — data never
// leaves the device except through a user-initiated JSON backup. The web
// demo always runs this way.
export const OFFLINE_ONLY = process.env.EXPO_PUBLIC_OFFLINE_ONLY === '1' || WEB_DEMO;
