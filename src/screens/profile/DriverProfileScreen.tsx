import React, { useEffect, useMemo } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useDriverStore } from '../../stores/driverStore';
import useHideTabs from '../../navigation/useHideTabs';

type DriverRouteParams = { driverId?: string; orderId?: string };

const DriverProfileScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<any>();
  const { driverId: routeDriverId, orderId } = (route.params ?? {}) as DriverRouteParams;

  const order = useOrderStore((state) =>
    orderId ? state.orders.find((item) => item.id === orderId) : undefined
  );
  const ensureDriverFromOrder = useDriverStore((state) => state.ensureDriverFromOrder);
  const resolvedDriverId = routeDriverId ?? order?.driverId;
  const driver = useDriverStore((state) =>
    resolvedDriverId ? state.drivers[resolvedDriverId] : undefined
  );

  useEffect(() => {
    if (!order) return;
    ensureDriverFromOrder(order);
  }, [order, ensureDriverFromOrder]);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const display = useMemo(() => {
    if (driver) return driver;
    if (!order) return null;
    return {
      id: order.driverId,
      name: order.driverName,
      phone: order.driverPhone,
      verified: order.driverMeta.verified,
      idCode: order.driverMeta.idCode,
      vehicle: order.driverVehicle,
      registrationText: order.driverMeta.registrationText,
      insuranceText: order.driverMeta.insuranceText,
      ratingAvg: order.driverRatingBase,
      ratingCount: 1,
    };
  }, [driver, order]);

  if (!display) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { paddingTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>
            Driver not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 42,
                height: 34,
                borderRadius: 8,
                backgroundColor: colors.dark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </TouchableOpacity>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
              Driver Details
            </Text>
          </View>

          <View
            style={{
              marginTop: 14,
              borderRadius: radii.lg,
              backgroundColor: colors.gray100,
              paddingVertical: 20,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: colors.gray300,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={44} color={colors.gray700} />
            </View>
            <Text style={{ marginTop: 10, fontFamily: typography.fonts.medium, color: colors.gray700 }}>
              ID: {display.idCode}
            </Text>
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="star" size={16} color={colors.yellow} />
              <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>
                {display.ratingAvg.toFixed(1)} ({display.ratingCount})
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 15, color: colors.dark }}>
              Personal Information
            </Text>
            <View style={{ marginTop: 10, gap: 6 }}>
              <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Name</Text>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{display.name}</Text>
              <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray600 }}>Phone number</Text>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{display.phone}</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
                <Text style={{ fontFamily: typography.fonts.medium, color: '#2E7D32' }}>
                  {display.verified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 15, color: colors.dark }}>
              Vehicle Details
            </Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Type</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{display.vehicle.type}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Model</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{display.vehicle.model}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Color</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{display.vehicle.color}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Plate</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{display.vehicle.plate}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ flex: 1, fontFamily: typography.fonts.regular, color: colors.gray600 }}>Registration</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontFamily: typography.fonts.medium, color: colors.dark }}>
                {display.registrationText}
              </Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ flex: 1, fontFamily: typography.fonts.regular, color: colors.gray600 }}>Insurance</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontFamily: typography.fonts.medium, color: colors.dark }}>
                {display.insuranceText}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverProfileScreen;
