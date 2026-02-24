import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

interface UiState {
  favouritesCount: number;
  cartCount: number;
  processingOrder: boolean;
  setFavouritesCount: (value: number) => void;
  setCartCount: (value: number) => void;
  setProcessingOrder: (value: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      favouritesCount: 2,
      cartCount: 3,
      processingOrder: true,
      setFavouritesCount: (value) => set({ favouritesCount: value }),
      setCartCount: (value) => set({ cartCount: value }),
      setProcessingOrder: (value) => set({ processingOrder: value }),
    }),
    {
      name: 'ui-store',
      storage: zustandStorage,
    }
  )
);
