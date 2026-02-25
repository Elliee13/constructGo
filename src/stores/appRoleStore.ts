import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { zustandStorage } from '../utils/storage';
import { useAuthStore } from './authStore';
import { useDriverAuthStore } from './driverAuthStore';
import { useOnboardingStore } from './onboardingStore';
import { useCartStore } from './cartStore';
import { useFavouritesStore } from './favouritesStore';
import { useDriverProfileStore } from './driverProfileStore';
import { useDriverOrdersStore } from './driverOrdersStore';
import { useStoreOwnerAuthStore } from './storeOwnerAuthStore';
import { useStoreOwnerProfileStore } from './storeOwnerProfileStore';
import { useAdminAuthStore } from './adminAuthStore';
import { signOutSupabase } from './supabaseAuthStore';
import { useProfileStore } from './profileStore';

export type AppRole = 'customer' | 'driver' | 'store_owner' | 'admin';

type AppRoleState = {
  appRole: AppRole | null;
  setRole: (role: AppRole | null) => void;
  switchRole: () => void;
  signOutAll: () => Promise<void>;
};

export const useAppRoleStore = create<AppRoleState>()(
  persist(
    (set) => ({
      appRole: null,
      setRole: (role) => set({ appRole: role }),
      switchRole: () => {
        // Role switch is non-destructive to keep one-time onboarding/login.
        useDriverOrdersStore.getState().clear();
        set({ appRole: null });
      },
      signOutAll: async () => {
        useAuthStore.setState({
          phone: '',
          firstName: '',
          lastName: '',
          email: '',
          loggedIn: false,
        });
        useDriverAuthStore.getState().clear();
        useOnboardingStore.setState({ hasCompletedOnboarding: false });
        useCartStore.setState({ items: [], cartCount: 0 });
        useFavouritesStore.setState({ favourites: [] });
        useDriverProfileStore.getState().clear();
        useDriverOrdersStore.getState().clear();
        useStoreOwnerAuthStore.getState().clear();
        useStoreOwnerProfileStore.getState().clear();
        useAdminAuthStore.getState().clear();
        useProfileStore.getState().clear();
        await signOutSupabase();
        set({ appRole: null });

        await AsyncStorage.multiRemove([
          'auth-store',
          'driver-auth-store',
          'onboarding-store',
          'address-info',
          'pref-notifications',
          'pref-emails',
          'pref-language',
          'driver-pref-notifications',
          'driver-pref-emails',
          'driver-pref-language',
          'recent-searches',
          'cart-store',
          'favourites-store',
          'driver-profile-store',
          'driver-orders-store',
          'store-owner-auth-store',
          'store-owner-profile-store',
          'admin-auth-store',
          'app-role-store',
        ]);
      },
    }),
    {
      name: 'app-role-store',
      storage: zustandStorage,
    }
  )
);
