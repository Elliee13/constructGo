import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverAccountScreen from '../screens/driver/DriverAccountScreen';
import DriverDeliveriesScreen from '../screens/driver/DriverDeliveriesScreen';
import DriverWalletScreen from '../screens/driver/DriverWalletScreen';
import DriverSettingsScreen from '../screens/driver/DriverSettingsScreen';
import DriverNotificationsScreen from '../screens/driver/DriverNotificationsScreen';
import DriverDeliveryDetailScreen from '../screens/driver/DriverDeliveryDetailScreen';
import DriverChatScreen from '../screens/driver/DriverChatScreen';

export type DriverAccountStackParamList = {
  AccountHome: undefined;
  Deliveries: undefined;
  Wallet: undefined;
  Settings: undefined;
  DriverNotifications: undefined;
  DriverDeliveryDetail: { orderId: string };
  DriverChat: { orderId: string };
};

const Stack = createNativeStackNavigator<DriverAccountStackParamList>();

const DriverAccountStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountHome" component={DriverAccountScreen} />
      <Stack.Screen name="Deliveries" component={DriverDeliveriesScreen} />
      <Stack.Screen name="Wallet" component={DriverWalletScreen} />
      <Stack.Screen name="Settings" component={DriverSettingsScreen} />
      <Stack.Screen name="DriverNotifications" component={DriverNotificationsScreen} />
      <Stack.Screen name="DriverDeliveryDetail" component={DriverDeliveryDetailScreen} />
      <Stack.Screen name="DriverChat" component={DriverChatScreen} />
    </Stack.Navigator>
  );
};

export default DriverAccountStack;


