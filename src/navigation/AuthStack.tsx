import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import NameScreen from '../screens/auth/NameScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import LocationPermissionScreen from '../screens/auth/LocationPermissionScreen';
import PaymentMethodScreen from '../screens/auth/PaymentMethodScreen';
import AddressScreen from '../screens/auth/AddressScreen';
import SupabaseCustomerSignInScreen from '../screens/auth/SupabaseCustomerSignInScreen';

export type AuthStackParamList = {
  SupabaseCustomerSignIn: undefined;
  PhoneInput: undefined;
  Otp: undefined;
  Name: undefined;
  Terms: undefined;
  LocationPermission: undefined;
  PaymentMethod: undefined;
  Address: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupabaseCustomerSignIn" component={SupabaseCustomerSignInScreen} />
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Name" component={NameScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
