import React, { useMemo } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useCatalogStore } from '../../stores/catalogStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { formatPrice } from '../../utils/format';

const StoreOwnerDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const orders = useOrderStore((s) => s.orders);
  const products = useCatalogStore((s) => s.products);
  const unreadCountStoreOwner = useNotificationStore((s) => s.unreadCountStoreOwner);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const deliveredToday = orders.filter((order) => order.status === 'Delivered' && order.createdAt.slice(0, 10) === today).length;
    return {
      pending: orders.filter((order) => order.status === 'Pending').length,
      preparing: orders.filter((order) => order.status === 'Preparing').length,
      ready: orders.filter((order) => order.status === 'Ready for Pickup').length,
      driverRequested: orders.filter((order) => order.status === 'Driver Requested').length,
      deliveredToday,
    };
  }, [orders]);

  const recent = useMemo(() => orders.slice(0, 5), [orders]);

  const getProductName = (productId?: string, productName?: string) =>
    products.find((product) => product.id === productId)?.name ?? productName ?? 'Hardware Item';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.yellow }}>ConstructGo</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StoreOwnerNotifications')}>
              <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications-outline" size={22} color={colors.dark} />
                {unreadCountStoreOwner > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: -2,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.dark,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 9, color: colors.yellow }}>
                      {unreadCountStoreOwner}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 14, borderRadius: 12, backgroundColor: colors.yellow, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.bold, fontSize: 20, color: colors.dark }}>Store Dashboard</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                Track order pipeline and dispatch to drivers.
              </Text>
            </View>
            <Ionicons name="storefront" size={34} color={colors.dark} />
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {[
              { label: 'Pending', value: stats.pending },
              { label: 'Preparing', value: stats.preparing },
              { label: 'Ready', value: stats.ready },
              { label: 'Driver Requested', value: stats.driverRequested },
              { label: 'Delivered Today', value: stats.deliveredToday },
            ].map((item) => (
              <View key={item.label} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>{item.label}</Text>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Text style={{ marginTop: 18, fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Recent Orders</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {recent.length === 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>No orders yet.</Text>
              </View>
            ) : (
              recent.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => navigation.navigate('Orders', { screen: 'StoreOwnerOrderDetail', params: { orderId: order.id } })}
                  style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}
                >
                  <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>
                    {getProductName(order.items[0]?.productId, order.items[0]?.productName)}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{order.code}</Text>
                  <View style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(order.total)}</Text>
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>More</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreOwnerDashboardScreen;
