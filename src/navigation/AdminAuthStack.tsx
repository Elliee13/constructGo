import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminSignInScreen from '../screens/admin/AdminSignInScreen';

export type AdminAuthStackParamList = {
  AdminSignIn: undefined;
};

const Stack = createNativeStackNavigator<AdminAuthStackParamList>();

const AdminAuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminSignIn" component={AdminSignInScreen} />
    </Stack.Navigator>
  );
};

export default AdminAuthStack;

