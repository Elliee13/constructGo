import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useOnboardingStore } from '../stores/onboardingStore';
import OnboardingStack from './OnboardingStack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import DriverAuthStack from './DriverAuthStack';
import DriverTabs from './DriverTabs';
import StoreOwnerAuthStack from './StoreOwnerAuthStack';
import StoreOwnerTabs from './StoreOwnerTabs';
import AdminAuthStack from './AdminAuthStack';
import AdminTabs from './AdminTabs';
import Toast from '../components/Toast';
import { useDriverAuthStore } from '../stores/driverAuthStore';
import { useAppRoleStore } from '../stores/appRoleStore';
import { useStoreOwnerAuthStore } from '../stores/storeOwnerAuthStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';
import { useSupabaseAuthStore } from '../stores/supabaseAuthStore';
import { useProfileStore } from '../stores/profileStore';
import RoleSelectScreen from '../screens/role/RoleSelectScreen';
import ComingSoonScreen from '../screens/role/ComingSoonScreen';

const RootNavigator = () => {
  const appRole = useAppRoleStore((s) => s.appRole);
  const setRole = useAppRoleStore((s) => s.setRole);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const customerLoggedIn = useAuthStore((s) => s.loggedIn);
  const driverLoggedIn = useDriverAuthStore((s) => s.loggedIn);
  const storeOwnerLoggedIn = useStoreOwnerAuthStore((s) => s.loggedIn);
  const adminLoggedIn = useAdminAuthStore((s) => s.loggedIn);
  const supabaseUserId = useSupabaseAuthStore((s) => s.userId);
  const supabaseSessionReady = useSupabaseAuthStore((s) => s.isReady);
  const hasSupabaseSession = useSupabaseAuthStore((s) => s.isAuthenticated);
  const profileRole = useProfileStore((s) => s.role);
  const loadProfileForSession = useProfileStore((s) => s.loadProfileForSession);
  const clearProfile = useProfileStore((s) => s.clear);

  React.useEffect(() => {
    if (!supabaseSessionReady) return;
    if (!hasSupabaseSession || !supabaseUserId) {
      clearProfile();
      return;
    }
    loadProfileForSession();
  }, [supabaseSessionReady, hasSupabaseSession, supabaseUserId, loadProfileForSession, clearProfile]);

  React.useEffect(() => {
    if (!supabaseSessionReady) return;
    if (!hasSupabaseSession || !profileRole) return;
    if (appRole !== profileRole) {
      setRole(profileRole);
    }
  }, [supabaseSessionReady, hasSupabaseSession, profileRole, appRole, setRole]);

  const supabaseRoleLoggedIn = (role: 'customer' | 'driver' | 'store_owner' | 'admin') =>
    hasSupabaseSession && profileRole === role;

  const customerAccess = customerLoggedIn || supabaseRoleLoggedIn('customer');
  const driverAccess = driverLoggedIn || supabaseRoleLoggedIn('driver');
  const storeOwnerAccess = storeOwnerLoggedIn || supabaseRoleLoggedIn('store_owner');
  const adminAccess = adminLoggedIn || supabaseRoleLoggedIn('admin');

  return (
    <>
      <NavigationContainer>
        {!appRole ? (
          <RoleSelectScreen />
        ) : appRole === 'customer' ? (
          !hasCompletedOnboarding ? (
            <OnboardingStack />
          ) : !customerAccess ? (
            <AuthStack />
          ) : (
            <MainTabs />
          )
        ) : appRole === 'driver' ? (
          driverAccess ? (
            <DriverTabs />
          ) : (
            <DriverAuthStack />
          )
        ) : appRole === 'store_owner' ? (
          storeOwnerAccess ? (
            <StoreOwnerTabs />
          ) : (
            <StoreOwnerAuthStack />
          )
        ) : appRole === 'admin' ? (
          adminAccess ? (
            <AdminTabs />
          ) : (
            <AdminAuthStack />
          )
        ) : (
          <ComingSoonScreen />
        )}
      </NavigationContainer>
      <Toast />
    </>
  );
};

export default RootNavigator;

