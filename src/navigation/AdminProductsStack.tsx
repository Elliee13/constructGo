import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';

export type AdminProductsStackParamList = {
  AdminProductsHome: undefined;
};

const Stack = createNativeStackNavigator<AdminProductsStackParamList>();

const AdminProductsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminProductsHome" component={AdminProductsScreen} />
    </Stack.Navigator>
  );
};

export default AdminProductsStack;
