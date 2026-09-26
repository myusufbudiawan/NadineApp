// Build-time flag for the offline-only variant (eas.json offline-* profiles,
// app.config.ts): no account, no sync, no API/Supabase calls — data never
// leaves the device except through a user-initiated JSON backup.
export const OFFLINE_ONLY = process.env.EXPO_PUBLIC_OFFLINE_ONLY === '1';
