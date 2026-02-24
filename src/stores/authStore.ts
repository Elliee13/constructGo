import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

interface AuthState {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  loggedIn: boolean;
  setPhone: (phone: string) => void;
  setName: (firstName: string, lastName: string) => void;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      phone: '',
      firstName: '',
      lastName: '',
      email: '',
      loggedIn: false,
      setPhone: (phone) => set({ phone }),
      setName: (firstName, lastName) => set({ firstName, lastName }),
      login: () => set({ loggedIn: true }),
      logout: () => set({ loggedIn: false }),
    }),
    {
      name: 'auth-store',
      storage: zustandStorage,
    }
  )
);
