import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminStoresScreen from '../screens/admin/AdminStoresScreen';

export type AdminStoresStackParamList = {
  AdminStoresHome: undefined;
};

const Stack = createNativeStackNavigator<AdminStoresStackParamList>();

const AdminStoresStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminStoresHome" component={AdminStoresScreen} />
    </Stack.Navigator>
  );
};

export default AdminStoresStack;
