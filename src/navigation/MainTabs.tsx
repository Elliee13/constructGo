import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import SearchScreen from "../screens/search/SearchScreen";
import ShopStack from "./ShopStack";
import AccountStack from "./AccountStack";
import { colors, typography } from "../theme/theme";
import { mainTabBarStyle } from "./tabBarStyle";

export type MainTabsParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
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
            route.name === "Home"
              ? "home"
              : route.name === "Search"
                ? "search"
                : "person";
          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ShopStack} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Profile"
        component={AccountStack}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate("Profile" as never, { screen: "AccountHome" } as never);
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
