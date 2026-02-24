import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreOwnerDashboardScreen from '../screens/storeOwner/StoreOwnerDashboardScreen';
import StoreOwnerNotificationsScreen from '../screens/storeOwner/StoreOwnerNotificationsScreen';

export type StoreOwnerDashboardStackParamList = {
  StoreOwnerDashboardHome: undefined;
  StoreOwnerNotifications: undefined;
};

const Stack = createNativeStackNavigator<StoreOwnerDashboardStackParamList>();

const StoreOwnerDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoreOwnerDashboardHome" component={StoreOwnerDashboardScreen} />
      <Stack.Screen name="StoreOwnerNotifications" component={StoreOwnerNotificationsScreen} />
    </Stack.Navigator>
  );
};

export default StoreOwnerDashboardStack;
