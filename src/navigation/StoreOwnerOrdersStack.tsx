import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreOwnerOrdersScreen from '../screens/storeOwner/StoreOwnerOrdersScreen';
import StoreOwnerOrderDetailScreen from '../screens/storeOwner/StoreOwnerOrderDetailScreen';

export type StoreOwnerOrdersStackParamList = {
  StoreOwnerOrdersHome: undefined;
  StoreOwnerOrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<StoreOwnerOrdersStackParamList>();

const StoreOwnerOrdersStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoreOwnerOrdersHome" component={StoreOwnerOrdersScreen} />
      <Stack.Screen name="StoreOwnerOrderDetail" component={StoreOwnerOrderDetailScreen} />
    </Stack.Navigator>
  );
};

export default StoreOwnerOrdersStack;
