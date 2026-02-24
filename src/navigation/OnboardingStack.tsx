import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GetStartedScreen from '../screens/onboarding/GetStartedScreen';

export type OnboardingStackParamList = {
  GetStarted: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GetStarted" component={GetStartedScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingStack;
