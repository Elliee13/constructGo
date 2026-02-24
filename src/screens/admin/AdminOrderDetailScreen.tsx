import React, { useMemo } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { AdminOrdersStackParamList } from '../../navigation/AdminOrdersStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useProductStore } from '../../stores/productStore';
import { useChatStore } from '../../stores/chatStore';
import { formatPrice } from '../../utils/format';

const timeline = ['Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Driver Requested', 'Out for Delivery', 'Delivered'];

type AdminOrderDetailRoute = RouteProp<AdminOrdersStackParamList, 'AdminOrderDetail'>;

const AdminOrderDetailScreen = () => {
  useHideTabs('AdminTabs');
  const navigation = useNavigation<any>();
  const route = useRoute<AdminOrderDetailRoute>();
  const { orderId } = route.params;

  const order = useOrderStore((s) => s.orders.find((entry) => entry.id === orderId));
  const products = useProductStore((s) => s.products);
  const threads = useChatStore((s) => s.threads);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  );
  const chatMessages = threads[orderId]?.messages ?? [];

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Order not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12, borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={[layout.container, { paddingTop: 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>

          <Text style={{ marginTop: 10, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
            Admin Order Detail
          </Text>
          <Text style={{ marginTop: 4, fontFamily: typography.fonts.medium, color: colors.dark }}>{order.code}</Text>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Overview</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Status: {order.status}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Customer: {(order as any).customerName ?? 'User, Example'}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Driver: {order.assignedDriverName ?? order.driverName ?? '-'}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Address: {order.address}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>
              Total: {formatPrice(order.total)}
            </Text>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Timeline</Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {timeline.map((step) => (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: order.status === step ? colors.dark : colors.gray300 }} />
                  <Text style={{ fontFamily: typography.fonts.regular, color: order.status === step ? colors.dark : colors.gray600 }}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Items</Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {order.items.map((item) => (
                <View key={item.cartItemId} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 10 }}>
                  <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>
                    {productNameById.get(item.productId) ?? 'Product'} x{item.qty}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                    Unit: {formatPrice(item.unitPrice)}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                    Line total: {formatPrice(item.itemTotal)}
                  </Text>
                  {item.selectedOptions?.length ? (
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                      Options: {item.selectedOptions.map((opt) => `${opt.groupName}: ${opt.label}`).join(' | ')}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Substitutions</Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {order.items.map((item) => {
                const sub = order.substitutions[item.cartItemId];
                return (
                  <View key={`sub-${item.cartItemId}`} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>
                      {productNameById.get(sub?.originalProductId ?? item.productId) ?? 'Product'}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                      Status: {sub?.status ?? 'none'}
                    </Text>
                    {sub?.substituteProductId ? (
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Proposed: {productNameById.get(sub.substituteProductId) ?? sub.substituteProductId}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Packing</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              All packed: {order.pack.allPacked ? 'Yes' : 'No'}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Packed at: {order.pack.packedAt ? new Date(order.pack.packedAt).toLocaleString() : '-'}
            </Text>
            <View style={{ marginTop: 8, gap: 6 }}>
              {order.items.map((item) => (
                <Text key={`pack-${item.cartItemId}`} style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  {productNameById.get(item.productId) ?? 'Product'}: {order.pack.items[item.cartItemId]?.packedQty ?? 0}/{item.qty}
                </Text>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Inventory Metadata</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Reserved: {order.inventory.reserved ? 'Yes' : 'No'}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Deducted: {order.inventory.deducted ? 'Yes' : 'No'}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Restocked: {order.inventory.restocked ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Chat Preview (Read-only)</Text>
            {chatMessages.length === 0 ? (
              <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                No chat messages for this order.
              </Text>
            ) : (
              <View style={{ marginTop: 8, gap: 8 }}>
                {chatMessages.slice(-5).map((message) => (
                  <View key={message.id} style={{ borderRadius: 8, backgroundColor: colors.gray100, padding: 8 }}>
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                      {message.sender === 'driver' ? 'Driver' : 'Customer'}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray700 }}>
                      {message.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminOrderDetailScreen;

