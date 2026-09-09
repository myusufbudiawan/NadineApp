import { createClient } from '@supabase/supabase-js';
import { secureStoreAdapter } from '@/lib/auth/session';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// A missing/misconfigured build must not crash the whole app on launch —
// log loudly and fall back to placeholder values so auth calls fail
// normally (network/API error) instead of the JS bundle throwing during
// module evaluation, before anything can render.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'This build was compiled without them — auth and sync will not work.',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? 'https://placeholder.invalid', supabaseAnonKey ?? 'placeholder', {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
