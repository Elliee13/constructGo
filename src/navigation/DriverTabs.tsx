import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverOrdersScreen from '../screens/driver/DriverOrdersScreen';
import DriverAccountStack from './DriverAccountStack';
import { colors, typography } from '../theme/theme';
import { mainTabBarStyle } from './tabBarStyle';

export type DriverTabsParamList = {
  Home: undefined;
  Orders: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<DriverTabsParamList>();

const DriverTabs = () => {
  return (
    <Tab.Navigator
      id="DriverTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: mainTabBarStyle,
        tabBarLabelStyle: {
          fontFamily: typography.fonts.medium,
          fontSize: 12,
        },
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.gray400,
        tabBarIcon: ({ color }) => {
          const iconName =
            route.name === 'Home' ? 'home' : route.name === 'Orders' ? 'list' : 'person';
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DriverHomeScreen} />
      <Tab.Screen name="Orders" component={DriverOrdersScreen} />
      <Tab.Screen
        name="Account"
        component={DriverAccountStack}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('Account' as never, { screen: 'AccountHome' } as never);
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default DriverTabs;


