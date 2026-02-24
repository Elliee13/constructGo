import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';

export type AdminAccountStackParamList = {
  AdminAccountHome: undefined;
};

const Stack = createNativeStackNavigator<AdminAccountStackParamList>();

const AdminAccountStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminAccountHome" component={AdminAccountScreen} />
    </Stack.Navigator>
  );
};

export default AdminAccountStack;
