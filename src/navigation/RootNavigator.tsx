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
import RoleSelectScreen from '../screens/role/RoleSelectScreen';
import ComingSoonScreen from '../screens/role/ComingSoonScreen';

const RootNavigator = () => {
  const appRole = useAppRoleStore((s) => s.appRole);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const customerLoggedIn = useAuthStore((s) => s.loggedIn);
  const driverLoggedIn = useDriverAuthStore((s) => s.loggedIn);
  const storeOwnerLoggedIn = useStoreOwnerAuthStore((s) => s.loggedIn);
  const adminLoggedIn = useAdminAuthStore((s) => s.loggedIn);

  return (
    <>
      <NavigationContainer>
        {!appRole ? (
          <RoleSelectScreen />
        ) : appRole === 'customer' ? (
          !hasCompletedOnboarding ? (
            <OnboardingStack />
          ) : !customerLoggedIn ? (
            <AuthStack />
          ) : (
            <MainTabs />
          )
        ) : appRole === 'driver' ? (
          driverLoggedIn ? (
            <DriverTabs />
          ) : (
            <DriverAuthStack />
          )
        ) : appRole === 'store_owner' ? (
          storeOwnerLoggedIn ? (
            <StoreOwnerTabs />
          ) : (
            <StoreOwnerAuthStack />
          )
        ) : appRole === 'admin' ? (
          adminLoggedIn ? (
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

