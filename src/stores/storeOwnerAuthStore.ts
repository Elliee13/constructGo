import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

type StoreOwnerAuthState = {
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

export const useStoreOwnerAuthStore = create<StoreOwnerAuthState>()(
  persist(
    (set) => ({
      ...initialState,
      signIn: (email) => set({ loggedIn: true, email: email.trim().toLowerCase() }),
      signOut: () => set({ loggedIn: false }),
      clear: () => set({ ...initialState }),
    }),
    {
      name: 'store-owner-auth-store',
      storage: zustandStorage,
    }
  )
);
