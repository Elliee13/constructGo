import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

export type AdminDashboardStackParamList = {
  AdminDashboardHome: undefined;
};

const Stack = createNativeStackNavigator<AdminDashboardStackParamList>();

const AdminDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboardHome" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
};

export default AdminDashboardStack;
