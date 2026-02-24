import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import { useDriverStore } from './driverStore';

export type DriverProfileState = {
  driverId: string;
  name: string;
  email: string;
  online: boolean;
  ratingAvg: number;
  ratingCount: number;
  deliveriesCount: number;
  onlineTimeMinutes: number;
  setOnline: (value: boolean) => void;
  incrementDeliveriesCount: () => void;
  syncRatingFromDriverStore: (driverId?: string) => void;
  clear: () => void;
};

const initialState = {
  driverId: 'drv-01',
  name: 'Miguel Santos',
  email: 'driver@constructgo.app',
  online: true,
  ratingAvg: 4.8,
  ratingCount: 1,
  deliveriesCount: 12,
  onlineTimeMinutes: 390,
};

export const useDriverProfileStore = create<DriverProfileState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setOnline: (value) => set({ online: value }),
      incrementDeliveriesCount: () => set({ deliveriesCount: get().deliveriesCount + 1 }),
      syncRatingFromDriverStore: (driverId) => {
        const targetId = driverId ?? get().driverId;
        const external = useDriverStore.getState().drivers[targetId];
        if (!external) return;
        set({
          driverId: external.id,
          name: external.name,
          ratingAvg: external.ratingAvg,
          ratingCount: external.ratingCount,
        });
      },
      clear: () => set({ ...initialState, online: false }),
    }),
    {
      name: 'driver-profile-store',
      storage: zustandStorage,
    }
  )
);


