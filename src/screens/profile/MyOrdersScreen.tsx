import React, { useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useCatalogStore } from '../../stores/catalogStore';
import { formatPrice } from '../../utils/format';
import StatusPill from '../../components/ui/StatusPill';

const MyOrdersScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<any>();
  const initialTab = route.params?.tab ?? 'Active';
  const [tab, setTab] = useState<'Active' | 'History'>(initialTab);
  const orders = useOrderStore((s) => s.orders);
  const products = useCatalogStore((s) => s.products);

  const activeOrders = useMemo(
    () => orders.filter((o) => ['Driver Requested', 'Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status)),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((o) => ['Delivered', 'Cancelled'].includes(o.status)),
    [orders]
  );

  const list = tab === 'Active' ? activeOrders : historyOrders;

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={20} color={colors.dark} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>My Orders</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 12 }}>
            {['Active', 'History'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item as 'Active' | 'History')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: tab === item ? colors.dark : colors.gray100,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: tab === item ? colors.white : colors.dark }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 16, gap: 16 }}>
            {list.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Ionicons name="cube-outline" size={30} color={colors.gray500} />
                <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>
                  No orders yet.
                </Text>
              </View>
            ) : (
              list.map((order) => {
                const product = products.find((p) => p.id === order.items[0]?.productId);
                return (
                  <View key={order.id} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Order Confirmed</Text>
                      <StatusPill status={order.status} size="sm" />
                    </View>

                    <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
                      <Image source={{ uri: product?.image ?? 'https://placehold.co/80x80' }} style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: colors.white }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>{product?.name ?? 'Order item'}</Text>
                        <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{order.code}</Text>
                        <Text style={{ marginTop: 6, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                          {formatPrice(order.total)} · {order.items.length} item(s)
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('OrderStatus', { orderId: order.id })}
                      style={{ marginTop: 12, alignSelf: 'flex-end' }}
                    >
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>View Order</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyOrdersScreen;
