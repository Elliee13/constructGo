import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyOrdersScreen from '../screens/profile/MyOrdersScreen';
import MyFavouritesScreen from '../screens/profile/MyFavouritesScreen';
import AddressScreen from '../screens/profile/AddressScreen';
import AddressEditScreen from '../screens/profile/AddressEditScreen';
import OrderStatusScreen from '../screens/profile/OrderStatusScreen';
import TrackScreen from '../screens/profile/TrackScreen';
import ChatScreen from '../screens/profile/ChatScreen';
import CustomerChatScreen from '../screens/customer/CustomerChatScreen';
import DriverProfileScreen from '../screens/profile/DriverProfileScreen';
import OrderResultScreen from '../screens/profile/OrderResultScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

export type AccountStackParamList = {
  AccountHome: undefined;
  MyOrders: { tab?: 'Active' | 'History' } | undefined;
  MyFavourites: undefined;
  Address: undefined;
  AddressEdit: undefined;
  OrderStatus: { orderId: string };
  Track: { orderId: string };
  Chat: { orderId: string };
  CustomerChat: { orderId: string };
  DriverProfile: { driverId?: string; orderId?: string };
  OrderResult: { orderId: string; status: 'Delivered' | 'Cancelled' };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<AccountStackParamList>();

const AccountStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountHome" component={ProfileScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="MyFavourites" component={MyFavouritesScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="AddressEdit" component={AddressEditScreen} />
      <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
      <Stack.Screen name="Track" component={TrackScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CustomerChat" component={CustomerChatScreen} />
      <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
      <Stack.Screen name="OrderResult" component={OrderResultScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
};

export default AccountStack;
