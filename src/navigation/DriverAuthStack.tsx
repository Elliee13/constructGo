import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverSignInScreen from '../screens/driver/DriverSignInScreen';

export type DriverAuthStackParamList = {
  DriverSignIn: undefined;
};

const Stack = createNativeStackNavigator<DriverAuthStackParamList>();

const DriverAuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverSignIn" component={DriverSignInScreen} />
    </Stack.Navigator>
  );
};

export default DriverAuthStack;


