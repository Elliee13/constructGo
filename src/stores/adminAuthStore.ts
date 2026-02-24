import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

type AdminAuthState = {
  loggedIn: boolean;
  email: string;
  signIn: (email: string, password: string) => void;
  signOut: () => void;
  clear: () => void;
};

const initialState = {
  loggedIn: false,
  email: '',
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      ...initialState,
      signIn: (email) => set({ loggedIn: true, email: email.trim().toLowerCase() }),
      signOut: () => set({ loggedIn: false }),
      clear: () => set({ ...initialState }),
    }),
    {
      name: 'admin-auth-store',
      storage: zustandStorage,
    }
  )
);

