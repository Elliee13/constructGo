import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreOwnerProductsScreen from '../screens/storeOwner/StoreOwnerProductsScreen';
import StoreOwnerProductEditScreen from '../screens/storeOwner/StoreOwnerProductEditScreen';

export type StoreOwnerProductsStackParamList = {
  StoreOwnerProductsHome: undefined;
  StoreOwnerProductEdit: { productId?: string } | undefined;
};

const Stack = createNativeStackNavigator<StoreOwnerProductsStackParamList>();

const StoreOwnerProductsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoreOwnerProductsHome" component={StoreOwnerProductsScreen} />
      <Stack.Screen name="StoreOwnerProductEdit" component={StoreOwnerProductEditScreen} />
    </Stack.Navigator>
  );
};

export default StoreOwnerProductsStack;
