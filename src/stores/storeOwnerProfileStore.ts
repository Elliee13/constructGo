import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

type StoreOwnerProfileState = {
  storeId: string;
  storeName: string;
  storeAddress: string;
  isActive: boolean;
  notifEnabled: boolean;
  setStoreId: (value: string) => void;
  setStoreName: (value: string) => void;
  setStoreAddress: (value: string) => void;
  setIsActive: (value: boolean) => void;
  setNotifEnabled: (value: boolean) => void;
  clear: () => void;
};

const initialState = {
  storeId: 'store-main',
  storeName: 'ConstructGo Hardware',
  storeAddress: 'Tagum City, Davao del Norte',
  isActive: true,
  notifEnabled: true,
};

export const useStoreOwnerProfileStore = create<StoreOwnerProfileState>()(
  persist(
    (set) => ({
      ...initialState,
      setStoreId: (value) => set({ storeId: value }),
      setStoreName: (value) => set({ storeName: value }),
      setStoreAddress: (value) => set({ storeAddress: value }),
      setIsActive: (value) => set({ isActive: value }),
      setNotifEnabled: (value) => set({ notifEnabled: value }),
      clear: () => set({ ...initialState }),
    }),
    {
      name: 'store-owner-profile-store',
      storage: zustandStorage,
    }
  )
);
