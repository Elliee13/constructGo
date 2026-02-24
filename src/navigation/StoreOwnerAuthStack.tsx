import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreOwnerSignInScreen from '../screens/storeOwner/StoreOwnerSignInScreen';

export type StoreOwnerAuthStackParamList = {
  StoreOwnerSignIn: undefined;
};

const Stack = createNativeStackNavigator<StoreOwnerAuthStackParamList>();

const StoreOwnerAuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoreOwnerSignIn" component={StoreOwnerSignInScreen} />
    </Stack.Navigator>
  );
};

export default StoreOwnerAuthStack;
