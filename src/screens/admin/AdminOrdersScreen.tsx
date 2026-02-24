import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useStoreOwnerProfileStore } from '../../stores/storeOwnerProfileStore';
import { formatPrice } from '../../utils/format';
import StatusPill from '../../components/ui/StatusPill';

const AdminOrdersScreen = () => {
  const navigation = useNavigation<any>();
  const orders = useOrderStore((s) => s.orders);
  const storeName = useStoreOwnerProfileStore((s) => s.storeName);
  const [tab, setTab] = useState<'All' | 'Active' | 'Delivered' | 'Cancelled'>('All');

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const filtered = useMemo(() => {
    if (tab === 'Delivered') return orders.filter((order) => order.status === 'Delivered');
    if (tab === 'Cancelled') return orders.filter((order) => order.status === 'Cancelled');
    if (tab === 'Active') {
      return orders.filter((order) =>
        ['Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Driver Requested', 'Out for Delivery'].includes(order.status)
      );
    }
    return orders;
  }, [orders, tab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Admin Orders</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
            {(['All', 'Active', 'Delivered', 'Cancelled'] as const).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item)}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: tab === item ? colors.dark : colors.gray100,
                }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: tab === item ? colors.white : colors.dark }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {filtered.length === 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>No orders in this tab.</Text>
              </View>
            ) : (
              filtered.map((order) => {
                const customerName = (order as any).customerName ?? 'User, Example';
                const driverName = order.assignedDriverName ?? order.driverName ?? '-';
                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => navigation.navigate('AdminOrderDetail', { orderId: order.id })}
                    style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>{order.code}</Text>
                      <StatusPill status={order.status} size="sm" />
                    </View>

                    <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                      Customer: {customerName}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                      Store: {storeName}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                      Driver: {driverName}
                    </Text>
                    <Text style={{ marginTop: 6, fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>
                      {formatPrice(order.total)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminOrdersScreen;
