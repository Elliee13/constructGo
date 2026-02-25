import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { zustandStorage } from '../utils/storage';
import { supabase } from '../lib/supabase';

type SupabaseAuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userEmail: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isReady: boolean;
  setSession: (session: Session | null) => void;
  setReady: (ready: boolean) => void;
  clear: () => void;
};

const applySession = (session: Session | null) => ({
  accessToken: session?.access_token ?? null,
  refreshToken: session?.refresh_token ?? null,
  userId: session?.user?.id ?? null,
  userEmail: session?.user?.email ?? null,
  expiresAt: session?.expires_at ?? null,
  isAuthenticated: Boolean(session?.access_token),
});

export const useSupabaseAuthStore = create<SupabaseAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      userEmail: null,
      expiresAt: null,
      isAuthenticated: false,
      isReady: false,
      setSession: (session) => set({ ...applySession(session) }),
      setReady: (ready) => set({ isReady: ready }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          userEmail: null,
          expiresAt: null,
          isAuthenticated: false,
          isReady: true,
        }),
    }),
    {
      name: 'supabase-auth-store',
      storage: zustandStorage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        userEmail: state.userEmail,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

let authListenerInitialized = false;

export const initSupabaseAuthListener = async () => {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  const store = useSupabaseAuthStore.getState();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) {
      store.setSession(data.session ?? null);
    }
  } finally {
    useSupabaseAuthStore.getState().setReady(true);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    useSupabaseAuthStore.getState().setSession(session ?? null);
    useSupabaseAuthStore.getState().setReady(true);
  });
};

export const getAccessToken = () => useSupabaseAuthStore.getState().accessToken;
export const getSupabaseUserId = () => useSupabaseAuthStore.getState().userId;
export const getSupabaseUserEmail = () => useSupabaseAuthStore.getState().userEmail;

export const signInWithSupabaseEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  useSupabaseAuthStore.getState().setSession(data.session ?? null);
  return data.user;
};

export const signUpWithSupabaseEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.session) {
    useSupabaseAuthStore.getState().setSession(data.session);
  }
  return data.user;
};

export const signOutSupabase = async () => {
  await supabase.auth.signOut();
  useSupabaseAuthStore.getState().clear();
};

export const getCurrentSupabaseUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
};
