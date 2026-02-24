import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme/theme';
import { mainTabBarStyle } from './tabBarStyle';
import AdminOrdersStack from './AdminOrdersStack';
import AdminDashboardStack from './AdminDashboardStack';
import AdminStoresStack from './AdminStoresStack';
import AdminProductsStack from './AdminProductsStack';
import AdminAccountStack from './AdminAccountStack';

export type AdminTabsParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Stores: undefined;
  Products: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<AdminTabsParamList>();

const AdminTabs = () => {
  return (
    <Tab.Navigator
      id="AdminTabs"
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
                : route.name === 'Stores'
                  ? 'storefront'
                  : route.name === 'Products'
                    ? 'construct'
                    : 'person';
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardStack} />
      <Tab.Screen
        name="Orders"
        component={AdminOrdersStack}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('Orders' as never, { screen: 'AdminOrdersHome' } as never);
          },
        })}
      />
      <Tab.Screen name="Stores" component={AdminStoresStack} />
      <Tab.Screen name="Products" component={AdminProductsStack} />
      <Tab.Screen name="Account" component={AdminAccountStack} />
    </Tab.Navigator>
  );
};

export default AdminTabs;
