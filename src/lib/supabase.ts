import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    storage: {
      getItem: async (key) => AsyncStorage.getItem(key),
      setItem: async (key, value) => AsyncStorage.setItem(key, value),
      removeItem: async (key) => AsyncStorage.removeItem(key),
    },
  },
});
