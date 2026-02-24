import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import { favourites as seedFavourites } from '../data/favourites';
import { useCartStore } from './cartStore';
import { useToastStore } from './toastStore';

interface FavouritesState {
  favourites: string[];
  toggleFavourite: (productId: string) => void;
  addManyToCart: (productIds: string[]) => void;
  isFavourite: (productId: string) => boolean;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      favourites: seedFavourites,
      toggleFavourite: (productId) => {
        const exists = get().favourites.includes(productId);
        const favourites = exists
          ? get().favourites.filter((id) => id !== productId)
          : [...get().favourites, productId];

        set({ favourites });

        useToastStore.getState().showToast({
          type: 'success',
          title: exists ? 'Removed from favourites' : 'Added to favourites',
          message: exists ? 'Item removed from saved list.' : 'Item saved to favourites.',
        });
      },
      addManyToCart: (productIds) => {
        const cart = useCartStore.getState();
        productIds.forEach((id) => cart.addToCart(id, 1));
      },
      isFavourite: (productId) => get().favourites.includes(productId),
    }),
    {
      name: 'favourites-store',
      storage: zustandStorage,
    }
  )
);
