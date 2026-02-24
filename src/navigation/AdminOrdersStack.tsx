import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';

export type AdminOrdersStackParamList = {
  AdminOrdersHome: undefined;
  AdminOrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<AdminOrdersStackParamList>();

const AdminOrdersStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminOrdersHome" component={AdminOrdersScreen} />
      <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
    </Stack.Navigator>
  );
};

export default AdminOrdersStack;

