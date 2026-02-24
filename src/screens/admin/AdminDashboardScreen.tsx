import React, { useMemo } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useStoreOwnerProfileStore } from '../../stores/storeOwnerProfileStore';
import { useDriverStore } from '../../stores/driverStore';
import { useDriverProfileStore } from '../../stores/driverProfileStore';
import { formatPrice } from '../../utils/format';

const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const orders = useOrderStore((s) => s.orders);
  const storeName = useStoreOwnerProfileStore((s) => s.storeName);
  const storeActive = useStoreOwnerProfileStore((s) => s.isActive);
  const drivers = useDriverStore((s) => s.drivers);
  const currentDriverOnline = useDriverProfileStore((s) => s.online);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter((order) => order.createdAt.slice(0, 10) === today);
    const activeOrders = orders.filter((order) =>
      ['Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Driver Requested', 'Out for Delivery'].includes(order.status)
    ).length;
    const deliveredToday = ordersToday.filter((order) => order.status === 'Delivered').length;
    const cancelledToday = ordersToday.filter((order) => order.status === 'Cancelled').length;
    const activeStores = storeActive ? 1 : 0;
    const driverCount = Object.keys(drivers).length;
    const activeDrivers = currentDriverOnline ? Math.max(1, driverCount) : 0;

    return {
      totalOrdersToday: ordersToday.length,
      activeOrders,
      deliveredToday,
      cancelledToday,
      activeStores,
      activeDrivers,
    };
  }, [orders, storeActive, currentDriverOnline, drivers]);

  const recent = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.yellow }}>ConstructGo</Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
            Admin Dashboard
          </Text>
          <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
            Oversight view across customer, store, and driver operations.
          </Text>

          <View style={{ marginTop: 14, borderRadius: 12, backgroundColor: colors.yellow, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>{storeName}</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                {storeActive ? 'Store is active' : 'Store is inactive'}
              </Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={30} color={colors.dark} />
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {[
              { label: 'Total Orders Today', value: kpis.totalOrdersToday },
              { label: 'Active Orders', value: kpis.activeOrders },
              { label: 'Delivered Today', value: kpis.deliveredToday },
              { label: 'Cancelled Today', value: kpis.cancelledToday },
              { label: 'Active Stores', value: kpis.activeStores },
              { label: 'Active Drivers', value: kpis.activeDrivers },
            ].map((item) => (
              <View key={item.label} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>{item.label}</Text>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Text style={{ marginTop: 18, fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>
            Recent Orders
          </Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {recent.length === 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>No orders yet.</Text>
              </View>
            ) : (
              recent.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => navigation.navigate('Orders', { screen: 'AdminOrderDetail', params: { orderId: order.id } })}
                  style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}
                >
                  <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{order.code}</Text>
                  <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                    {order.status}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: typography.fonts.medium, color: colors.dark }}>
                    {formatPrice(order.total)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;

