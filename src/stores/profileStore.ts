import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { zustandStorage } from '../utils/storage';
import type { AppRole } from './appRoleStore';
import { getSupabaseUserEmail, getSupabaseUserId } from './supabaseAuthStore';

type ProfileRole = AppRole;

type ProfileState = {
  userId: string | null;
  email: string | null;
  role: ProfileRole | null;
  isLoading: boolean;
  loadProfileForSession: () => Promise<ProfileRole | null>;
  ensureProfileForRole: (role: ProfileRole) => Promise<ProfileRole | null>;
  clear: () => void;
};

const isRole = (value: string): value is ProfileRole =>
  value === 'customer' || value === 'driver' || value === 'store_owner' || value === 'admin';

const normalizeRole = (role: string | null | undefined): ProfileRole => {
  if (role && isRole(role)) return role;
  return 'customer';
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      userId: null,
      email: null,
      role: null,
      isLoading: false,
      loadProfileForSession: async () => {
        const userId = getSupabaseUserId();
        if (!userId) {
          set({ userId: null, email: null, role: null, isLoading: false });
          return null;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id,email,role')
            .eq('id', userId)
            .single();

          if (error || !data) {
            set({ userId, email: getSupabaseUserEmail(), role: null, isLoading: false });
            return null;
          }

          const role = normalizeRole(data.role);
          set({ userId: data.id, email: data.email ?? getSupabaseUserEmail(), role, isLoading: false });
          return role;
        } catch {
          set({ userId, email: getSupabaseUserEmail(), role: null, isLoading: false });
          return null;
        }
      },
      ensureProfileForRole: async (role) => {
        const userId = getSupabaseUserId();
        const email = getSupabaseUserEmail();
        if (!userId) return null;

        set({ isLoading: true });
        try {
          const payload = {
            id: userId,
            email: email ?? null,
            role,
          };

          const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
          if (error) throw error;

          set({ userId, email: email ?? null, role, isLoading: false });
          return role;
        } catch {
          set({ isLoading: false });
          return null;
        }
      },
      clear: () => set({ userId: null, email: null, role: null, isLoading: false }),
    }),
    {
      name: 'profile-store',
      storage: zustandStorage,
    }
  )
);
