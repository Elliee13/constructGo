import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

type DriverAuthState = {
  phone: string;
  firstName: string;
  lastName: string;
  loggedIn: boolean;
  setPhone: (phone: string) => void;
  setName: (firstName: string, lastName: string) => void;
  login: () => void;
  logout: () => void;
  clear: () => void;
};

const initialState = {
  phone: '',
  firstName: 'Miguel',
  lastName: 'Santos',
  loggedIn: false,
};

export const useDriverAuthStore = create<DriverAuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setPhone: (phone) => set({ phone }),
      setName: (firstName, lastName) => set({ firstName, lastName }),
      login: () => set({ loggedIn: true }),
      logout: () => set({ loggedIn: false }),
      clear: () => set({ ...initialState }),
    }),
    {
      name: 'driver-auth-store',
      storage: zustandStorage,
    }
  )
);


