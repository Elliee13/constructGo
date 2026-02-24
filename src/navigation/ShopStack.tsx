import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import CategoryResultsScreen from '../screens/shop/CategoryResultsScreen';
import ProductResultsScreen from '../screens/shop/ProductResultsScreen';
import ProductDetailsScreen from '../screens/shop/ProductDetailsScreen';
import ProductOptionsScreen from '../screens/shop/ProductOptionsScreen';
import MyCartScreen from '../screens/shop/MyCartScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import LoadingOrderScreen from '../screens/shop/LoadingOrderScreen';

export type ShopStackParamList = {
  ShopHome: undefined;
  CategoryResults: { category: string };
  ProductResults: { title: string; query?: string };
  ProductDetails: { productId: string };
  ProductOptions: { productId: string };
  MyCart: undefined;
  Checkout: { cartItemIds: string[] };
  LoadingOrder: { orderId: string };
};

const Stack = createNativeStackNavigator<ShopStackParamList>();

const ShopStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopHome" component={HomeScreen} />
      <Stack.Screen name="CategoryResults" component={CategoryResultsScreen} />
      <Stack.Screen name="ProductResults" component={ProductResultsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="ProductOptions" component={ProductOptionsScreen} />
      <Stack.Screen name="MyCart" component={MyCartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="LoadingOrder" component={LoadingOrderScreen} />
    </Stack.Navigator>
  );
};

export default ShopStack;
