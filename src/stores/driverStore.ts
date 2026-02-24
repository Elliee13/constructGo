import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import type { Order } from './orderStore';

export type DriverRecord = {
  id: string;
  name: string;
  phone: string;
  verified: boolean;
  idCode: string;
  vehicle: { type: string; model: string; color: string; plate: string };
  registrationText: string;
  insuranceText: string;
  ratingAvg: number;
  ratingCount: number;
};

type DriverState = {
  drivers: Record<string, DriverRecord>;
  ensureDriverFromOrder: (order: Pick<Order,
    | 'driverId'
    | 'driverName'
    | 'driverPhone'
    | 'driverMeta'
    | 'driverVehicle'
    | 'driverRatingBase'
  >) => void;
  submitDriverRating: (driverId: string, rating: number) => void;
  getDriver: (driverId: string) => DriverRecord | undefined;
  clearAll: () => void;
};

const clampRating = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.max(1, Math.min(5, value));
};

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      drivers: {},
      ensureDriverFromOrder: (order) => {
        const existing = get().drivers[order.driverId];
        if (existing) return;

        const next: DriverRecord = {
          id: order.driverId,
          name: order.driverName,
          phone: order.driverPhone,
          verified: order.driverMeta.verified,
          idCode: order.driverMeta.idCode,
          vehicle: order.driverVehicle,
          registrationText: order.driverMeta.registrationText,
          insuranceText: order.driverMeta.insuranceText,
          ratingAvg: order.driverRatingBase,
          ratingCount: 1,
        };

        set({
          drivers: {
            ...get().drivers,
            [next.id]: next,
          },
        });
      },
      submitDriverRating: (driverId, rating) => {
        const value = clampRating(rating);
        const current = get().drivers[driverId];
        if (!current) return;

        const oldCount = current.ratingCount;
        const oldAvg = current.ratingAvg;
        const nextCount = oldCount + 1;
        const nextAvg = (oldAvg * oldCount + value) / nextCount;

        set({
          drivers: {
            ...get().drivers,
            [driverId]: {
              ...current,
              ratingAvg: Number(nextAvg.toFixed(2)),
              ratingCount: nextCount,
            },
          },
        });
      },
      getDriver: (driverId) => get().drivers[driverId],
      clearAll: () => set({ drivers: {} }),
    }),
    {
      name: 'constructgo_drivers',
      storage: zustandStorage,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<DriverState> | undefined),
        drivers: {
          ...currentState.drivers,
          ...((persistedState as Partial<DriverState> | undefined)?.drivers ?? {}),
        },
      }),
    }
  )
);
