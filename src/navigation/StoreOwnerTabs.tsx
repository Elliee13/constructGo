import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme/theme';
import { mainTabBarStyle } from './tabBarStyle';
import StoreOwnerDashboardStack from './StoreOwnerDashboardStack';
import StoreOwnerOrdersStack from './StoreOwnerOrdersStack';
import StoreOwnerProductsStack from './StoreOwnerProductsStack';
import StoreOwnerAccountScreen from '../screens/storeOwner/StoreOwnerAccountScreen';

export type StoreOwnerTabsParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Products: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<StoreOwnerTabsParamList>();

const StoreOwnerTabs = () => {
  return (
    <Tab.Navigator
      id="StoreOwnerTabs"
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
            route.name === 'Dashboard'
              ? 'speedometer'
              : route.name === 'Orders'
                ? 'list'
                : route.name === 'Products'
                  ? 'construct'
                  : 'person';
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={StoreOwnerDashboardStack}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('Dashboard' as never, { screen: 'StoreOwnerDashboardHome' } as never);
          },
        })}
      />
      <Tab.Screen
        name="Orders"
        component={StoreOwnerOrdersStack}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('Orders' as never, { screen: 'StoreOwnerOrdersHome' } as never);
          },
        })}
      />
      <Tab.Screen
        name="Products"
        component={StoreOwnerProductsStack}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('Products' as never, { screen: 'StoreOwnerProductsHome' } as never);
          },
        })}
      />
      <Tab.Screen name="Account" component={StoreOwnerAccountScreen} />
    </Tab.Navigator>
  );
};

export default StoreOwnerTabs;
