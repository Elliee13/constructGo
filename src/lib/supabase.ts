import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep runtime alive for legacy/local auth fallback during migration.
  // Screens using Supabase should handle missing env gracefully.
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are missing. Falling back to local auth flows.');
}

export const supabase = createClient(supabaseUrl ?? 'https://invalid.local', supabaseAnonKey ?? 'invalid-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
