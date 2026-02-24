import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useCatalogStore } from '../../stores/catalogStore';
import { useToastStore } from '../../stores/toastStore';
import { useDriverStore } from '../../stores/driverStore';
import { useProductStore } from '../../stores/productStore';
import useHideTabs from '../../navigation/useHideTabs';
import { formatPrice } from '../../utils/format';
import CancelReasonModal from '../../components/CancelReasonModal';
import StatusPill from '../../components/ui/StatusPill';

const timelineStages = ['Pending', 'Processing', 'Preparing', 'Packed', 'Ready for Pickup', 'Out for Delivery', 'Delivered'] as const;
const statusIndexMap: Record<string, number> = {
  Pending: 0,
  Processing: 1,
  Preparing: 2,
  'Driver Requested': 4,
  'Ready for Pickup': 4,
  'Out for Delivery': 5,
  Delivered: 6,
};

const OrderStatusScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId));
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const acceptSubstitution = useOrderStore((s) => s.acceptSubstitution);
  const rejectSubstitution = useOrderStore((s) => s.rejectSubstitution);
  const startStatusSimulation = useOrderStore((s) => s.startStatusSimulation);
  const showToast = useToastStore((s) => s.showToast);
  const products = useCatalogStore((s) => s.products);
  const allProducts = useProductStore((s) => s.products);
  const ensureDriverFromOrder = useDriverStore((s) => s.ensureDriverFromOrder);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const deliveredHandledRef = useRef(false);
  const [summaryY, setSummaryY] = useState(0);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [busySubstitutionLine, setBusySubstitutionLine] = useState<string | null>(null);

  useEffect(() => {
    if (order?.status === 'Processing') {
      startStatusSimulation(order.id);
    }
  }, [order, startStatusSimulation]);

  useEffect(() => {
    if (!order) return;
    ensureDriverFromOrder(order);
  }, [order, ensureDriverFromOrder]);

  useEffect(() => {
    if (order?.status === 'Delivered' && !deliveredHandledRef.current) {
      deliveredHandledRef.current = true;
      navigation.reset({
        index: 0,
        routes: [{ name: 'OrderResult', params: { orderId: order.id, status: 'Delivered' } }],
      });
    }
  }, [order, navigation]);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={[layout.container, { paddingTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Order not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = ['Driver Requested', 'Pending', 'Processing', 'Preparing', 'Ready for Pickup'].includes(order.status);
  const canTrack = order.status === 'Out for Delivery';
  const canMessageDriver = order.status === 'Out for Delivery' && Boolean(order.assignedDriverId);
  const baseStatusIndex =
    order.status === 'Cancelled'
      ? order.driverDecision === 'accepted'
        ? 5
        : order.pack?.allPacked
          ? 4
          : 2
      : statusIndexMap[order.status] ?? 0;
  const completedIndex = order.pack?.allPacked ? Math.max(baseStatusIndex, 3) : baseStatusIndex;
  const proposedSubstitutions = order.items
    .map((item) => {
      const substitution = order.substitutions?.[item.cartItemId];
      if (!substitution || substitution.status !== 'proposed') return null;
      return { item, substitution };
    })
    .filter(Boolean) as Array<{
    item: (typeof order.items)[number];
    substitution: (typeof order.substitutions)[string];
  }>;

  const handleCancel = () => {
    if (!canCancel) {
      showToast({
        type: 'warning',
        title: 'Unable to cancel',
        message: 'Cannot cancel once order is out for delivery.',
      });
      return;
    }
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = (reason: string, details?: string) => {
    if (!order) return;
    const cancelled = cancelOrder(order.id, reason, details, 'customer');
    if (!cancelled) {
      setIsCancelModalVisible(false);
      return;
    }
    setIsCancelModalVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'OrderResult', params: { orderId: order.id, status: 'Cancelled' } }],
    });
  };

  const handleMessageDriver = () => {
    if (!canMessageDriver) {
      showToast({
        type: 'warning',
        title: 'Driver not assigned',
        message: 'Driver not assigned yet',
      });
      return;
    }
    navigation.navigate('CustomerChat', { orderId: order.id });
  };

  const handleAcceptSubstitution = (lineKey: string) => {
    if (busySubstitutionLine === lineKey) return;
    setBusySubstitutionLine(lineKey);
    try {
      const ok = acceptSubstitution(order.id, lineKey);
      if (!ok) {
        showToast({
          type: 'warning',
          title: 'Unable to accept',
          message: 'Substitute item is unavailable.',
        });
      }
    } finally {
      setBusySubstitutionLine(null);
    }
  };

  const handleRejectSubstitution = (lineKey: string) => {
    if (busySubstitutionLine === lineKey) return;
    setBusySubstitutionLine(lineKey);
    try {
      rejectSubstitution(order.id, lineKey);
    } finally {
      setBusySubstitutionLine(null);
    }
  };

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const stickyBottom = Math.max(insets.bottom + 8, 16);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: stickyBottom + 74 }}>
        <View style={[layout.container, { paddingTop: 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Order Status</Text>

          <View style={{ marginTop: 12, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Order Code</Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.semibold, color: colors.dark }}>{order.code}</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray600 }}>
              Total: {formatPrice(order.total)}
            </Text>
            <View style={{ marginTop: 8 }}>
              <StatusPill status={order.status} size="sm" />
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            {timelineStages.map((step, index) => {
              const isCompleted = index < completedIndex;
              const isCurrent = order.status !== 'Cancelled' && index === completedIndex;
              const isFuture = index > completedIndex;
              return (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  ) : isCurrent ? (
                    <Ionicons name="ellipse" size={10} color={colors.dark} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={10} color={colors.gray400} />
                  )}
                  <Text
                    style={{
                      fontFamily: isCurrent ? typography.fonts.medium : typography.fonts.regular,
                      color: isFuture ? colors.gray500 : colors.dark,
                    }}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
            {order.status === 'Cancelled' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="close-circle" size={14} color={colors.error} />
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.error }}>Cancelled</Text>
              </View>
            ) : null}
          </View>

          {proposedSubstitutions.length ? (
            <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Substitution requested</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                Store proposed replacement items for unavailable products.
              </Text>
              <View style={{ marginTop: 10, gap: 10 }}>
                {proposedSubstitutions.map(({ item, substitution }) => {
                  const currentProduct = allProducts.find((product) => product.id === item.productId);
                  const originalProduct =
                    allProducts.find((product) => product.id === substitution.originalProductId) ?? currentProduct;
                  const substituteProduct = substitution.substituteProductId
                    ? allProducts.find((product) => product.id === substitution.substituteProductId)
                    : undefined;
                  const proposedQty = Math.max(1, Math.floor(substitution.proposedQty ?? item.qty));

                  return (
                    <View key={item.cartItemId} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 10 }}>
                      <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>
                        {originalProduct?.name ?? 'Original item'} x{item.qty}
                      </Text>
                      <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Proposed: {substituteProduct?.name ?? 'Unavailable item'} x{proposedQty}
                      </Text>

                      <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          disabled={busySubstitutionLine === item.cartItemId}
                          onPress={() => handleAcceptSubstitution(item.cartItemId)}
                          style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 8,
                            backgroundColor: colors.dark,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {busySubstitutionLine === item.cartItemId ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.white }}>Accept</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={busySubstitutionLine === item.cartItemId}
                          onPress={() => handleRejectSubstitution(item.cartItemId)}
                          style={{
                            flex: 1,
                            height: 40,
                            borderRadius: 8,
                            backgroundColor: '#FCE8E8',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {busySubstitutionLine === item.cartItemId ? (
                            <ActivityIndicator size="small" color="#B3261E" />
                          ) : (
                            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: '#B3261E' }}>Reject</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleCancel}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: canCancel ? colors.dark : colors.gray300,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, color: canCancel ? colors.white : colors.gray600 }}>Cancel Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => scrollRef.current?.scrollTo({ y: summaryY, animated: true })}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.dark }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>View Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!canTrack}
              onPress={() => navigation.navigate('Track', { orderId: order.id })}
              style={{ opacity: canTrack ? 1 : 0.4 }}
            >
              <Ionicons name="location" size={20} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <View
            onLayout={(event) => setSummaryY(event.nativeEvent.layout.y)}
            style={{ marginTop: 20, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}
          >
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Order Summary</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {order.items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <View key={item.cartItemId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>
                        {product?.name ?? 'Item'} x{item.qty}
                      </Text>
                      {item.selectedOptions && item.selectedOptions.length > 0 ? (
                        <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                          {item.selectedOptions.map((option) => `${option.groupName}: ${option.label}`).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(item.itemTotal)}</Text>
                  </View>
                );
              })}
              <View style={{ height: 1, backgroundColor: colors.gray200, marginVertical: 6 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Subtotal</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(order.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Delivery Fee</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(order.deliveryFee)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Total</Text>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{formatPrice(order.total)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: stickyBottom, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => {}}
          style={{ flex: 1, height: 50, borderRadius: 10, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleMessageDriver}
          disabled={!canMessageDriver}
          style={{
            flex: 1,
            height: 50,
            borderRadius: 10,
            backgroundColor: canMessageDriver ? colors.dark : colors.gray300,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typography.fonts.medium, color: canMessageDriver ? colors.white : colors.gray600 }}>
            Message Driver
          </Text>
        </TouchableOpacity>
      </View>
      {!canMessageDriver ? (
        <View style={{ position: 'absolute', right: 16, bottom: Math.max(stickyBottom - 16, 0) }}>
          <Text style={{ textAlign: 'right', fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
            Available once driver is assigned.
          </Text>
        </View>
      ) : null}
      <CancelReasonModal
        visible={isCancelModalVisible}
        onClose={() => setIsCancelModalVisible(false)}
        onConfirm={handleConfirmCancel}
      />
    </SafeAreaView>
  );
};

export default OrderStatusScreen;
