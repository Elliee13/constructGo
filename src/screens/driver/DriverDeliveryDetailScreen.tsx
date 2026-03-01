import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { DriverAccountStackParamList } from '../../navigation/DriverAccountStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useProductStore } from '../../stores/productStore';
import { useDriverProfileStore } from '../../stores/driverProfileStore';
import { useToastStore } from '../../stores/toastStore';
import { useDriverWalletStore } from '../../stores/driverWalletStore';
import MapPlaceholder from '../../components/MapPlaceholder';
import StatusPill from '../../components/ui/StatusPill';
import CodBadge from '../../components/ui/CodBadge';
import { formatPrice } from '../../utils/format';
import { markOrderDelivered } from '../../api/ordersService';

const requestDeclineReasons = ['Too far', 'Not available', 'Vehicle issue', 'Other'] as const;
const cancelReasons = ['Customer not reachable', 'Address issue', 'Vehicle issue', 'Safety concern', 'Other'] as const;

type DriverDetailRoute = RouteProp<DriverAccountStackParamList, 'DriverDeliveryDetail'>;
type ReasonMode = 'decline' | 'cancel' | null;

const getTimelineStep = (status: string) => {
  if (status === 'Delivered') return 3;
  if (status === 'Out for Delivery') return 2;
  if (status === 'Cancelled') return 1;
  return 0;
};

const DriverDeliveryDetailScreen = () => {
  useHideTabs('DriverTabs');
  const navigation = useNavigation<NativeStackNavigationProp<DriverAccountStackParamList>>();
  const route = useRoute<DriverDetailRoute>();
  const { orderId } = route.params;

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const orders = useOrderStore((state) => state.orders);
  const products = useProductStore((state) => state.products);
  const acceptDriverRequest = useOrderStore((state) => state.acceptDriverRequest);
  const declineDriverRequest = useOrderStore((state) => state.declineDriverRequest);
  const markDeliveredByDriver = useOrderStore((state) => state.markDeliveredByDriver);
  const cancelOrder = useOrderStore((state) => state.cancelOrder);

  const driverId = useDriverProfileStore((state) => state.driverId);
  const driverName = useDriverProfileStore((state) => state.name);

  const showToast = useToastStore((state) => state.showToast);
  const creditFromDelivery = useDriverWalletStore((state) => state.creditFromDelivery);

  const [reasonMode, setReasonMode] = useState<ReasonMode>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const order = useMemo(() => orders.find((entry) => entry.id === orderId), [orders, orderId]);
  const timelineStep = getTimelineStep(order?.status ?? '');

  const actionState = useMemo(() => {
    if (!order) return { request: false, active: false, closed: true };
    return {
      request: order.status === 'Driver Requested',
      active: order.status === 'Out for Delivery' && order.driverDecision === 'accepted',
      closed: order.status === 'Delivered' || order.status === 'Cancelled',
    };
  }, [order]);

  const lineItems = useMemo(() => {
    if (!order) return [];
    return order.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return {
        key: item.cartItemId,
        name: product?.name ?? 'Hardware Item',
        image: product?.images?.[0] ?? product?.image ?? '',
        qty: item.qty,
        total: item.itemTotal,
        options: item.selectedOptions ?? [],
      };
    });
  }, [order, products]);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { flex: 1, paddingTop: 24, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Order not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginTop: 14,
              height: 44,
              borderRadius: 10,
              paddingHorizontal: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.dark,
            }}
          >
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const customerName = (order as any).customerName ?? 'Juan Dela Cruz';
  const customerPhone = (order as any).customerPhone ?? '+63 917 000 0000';
  const canConfirmReason = selectedReason.length > 0 && (selectedReason !== 'Other' || reasonDetails.trim().length > 0);
  const reasons = reasonMode === 'cancel' ? cancelReasons : requestDeclineReasons;

  const closeReasonModal = () => {
    setReasonMode(null);
    setSelectedReason('');
    setReasonDetails('');
  };

  const handleAccept = () => {
    if (busyAction === 'accept') return;
    setBusyAction('accept');
    const ok = acceptDriverRequest(order.id, driverId || 'DRV-001', driverName || 'Driver');
    if (ok) {
      showToast({ type: 'success', title: 'Delivery accepted', message: 'You accepted this request.' });
    }
    setBusyAction(null);
  };

  const handleDelivered = async () => {
    if (busyAction === 'delivered') return;
    setBusyAction('delivered');
    try {
      if (!order.backendOrderId) {
        showToast({
          type: 'warning',
          title: 'Missing backend order',
          message: 'This delivery has no backend order id.',
        });
        return;
      }

      await markOrderDelivered(order.backendOrderId);
      const ok = markDeliveredByDriver(order.id);
      if (ok) {
        creditFromDelivery(order);
        showToast({ type: 'success', title: 'Marked as delivered', message: `${order.code} marked delivered.` });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Unable to complete delivery',
        message: error instanceof Error ? error.message : 'Request failed',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmReason = () => {
    if (!canConfirmReason) return;
    if (busyAction === 'confirm-reason') return;
    setBusyAction('confirm-reason');

    const details = reasonDetails.trim();
    const reasonText = selectedReason === 'Other' && details ? `Other: ${details}` : selectedReason;

    if (reasonMode === 'decline') {
      const ok = declineDriverRequest(order.id, driverId || 'DRV-001', reasonText);
      if (!ok) {
        setBusyAction(null);
        return;
      }
      showToast({ type: 'warning', title: 'Request declined', message: `${order.code} was declined.` });
      closeReasonModal();
      navigation.goBack();
      setBusyAction(null);
      return;
    }

    const ok = cancelOrder(order.id, selectedReason, details, 'driver');
    if (!ok) {
      setBusyAction(null);
      return;
    }
    showToast({ type: 'error', title: 'Delivery cancelled', message: `${order.code} was cancelled.` });
    closeReasonModal();
    setBusyAction(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { flex: 1 }]}>
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              height: 40,
              borderRadius: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.dark,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.white} />
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Delivery Details</Text>

          <StatusPill status={order.status} size="sm" />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 14,
            paddingBottom: actionState.request || actionState.active ? Math.max(insets.bottom + 120, 132) : 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.gray200,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={20} color={colors.gray700} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 15, color: colors.dark }}>{customerName}</Text>
                  <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{customerPhone}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${customerPhone.replace(/[^\d+]/g, '')}`)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.dark,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="call-outline" size={16} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('DriverChat', { orderId: order.id })}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.gray100,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.dark} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <MapPlaceholder height={176} style={{ marginTop: 12 }} />
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>Address</Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray700 }}>{order.address}</Text>
            <Text style={{ marginTop: 3, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.gray600 }}>2.4 km - 12 mins</Text>
          </View>

          <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Order Summary</Text>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.gray600 }}>{order.code}</Text>
            </View>

            <View style={{ marginTop: 10, gap: 10 }}>
              {lineItems.map((item) => (
                <View key={item.key} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.white }}>
                    {item.image ? <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>{item.name}</Text>
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Qty: {item.qty}</Text>
                    {item.options.length > 0 ? (
                      <View style={{ marginTop: 2 }}>
                        {item.options.map((option) => (
                          <Text
                            key={option.optionId}
                            style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}
                          >
                            {option.groupName}: {option.label}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{formatPrice(item.total)}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.gray200, paddingTop: 10, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Subtotal</Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{formatPrice(order.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Delivery Fee</Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                  {formatPrice(order.deliveryFee + order.deliveryOptionFee)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>Total</Text>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>{formatPrice(order.total)}</Text>
              </View>
              <View style={{ marginTop: 4 }}>
                <CodBadge />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 15, color: colors.dark }}>Progress</Text>
            {['Requested', 'Accepted', 'Out for Delivery', 'Delivered'].map((label, index) => {
              const active = index <= timelineStep;
              return (
                <View key={label} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: active ? colors.yellow : colors.gray300,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: active ? typography.fonts.medium : typography.fonts.regular,
                      fontSize: 12,
                      color: active ? colors.dark : colors.gray600,
                    }}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          {actionState.closed ? (
            <View style={{ marginTop: 16, borderRadius: radii.lg, backgroundColor: colors.gray100, padding: 12 }}>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.gray700 }}>This order is closed.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {actionState.request || actionState.active ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.gray200,
            backgroundColor: colors.white,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom + 8, 12),
          }}
        >
          <View style={[layout.container, { flexDirection: 'row', gap: 10 }]}>
            {actionState.request ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setReasonMode('decline');
                    setSelectedReason('');
                    setReasonDetails('');
                  }}
                  disabled={busyAction === 'confirm-reason' || busyAction === 'accept'}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FCE8E8',
                  }}
                >
                  <Text style={{ fontFamily: typography.fonts.medium, color: colors.error }}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={busyAction === 'accept' || busyAction === 'confirm-reason'}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#DFF2E1',
                  }}
                >
                  {busyAction === 'accept' ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.success }}>Accept</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setReasonMode('cancel');
                    setSelectedReason('');
                    setReasonDetails('');
                  }}
                  disabled={busyAction === 'confirm-reason' || busyAction === 'delivered'}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FCE8E8',
                  }}
                >
                  <Text style={{ fontFamily: typography.fonts.medium, color: colors.error }}>Cancel Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelivered}
                  disabled={busyAction === 'delivered' || busyAction === 'confirm-reason'}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#DFF2E1',
                  }}
                >
                  {busyAction === 'delivered' ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.success }}>Mark Delivered</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ) : null}

      <Modal transparent visible={reasonMode !== null} animationType="fade" onRequestClose={closeReasonModal}>
        <TouchableWithoutFeedback onPress={closeReasonModal}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  borderTopLeftRadius: radii.lg,
                  borderTopRightRadius: radii.lg,
                  backgroundColor: colors.white,
                  paddingHorizontal: 16,
                  paddingTop: 18,
                  paddingBottom: 20,
                }}
              >
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
                  {reasonMode === 'cancel' ? 'Cancel Delivery' : 'Decline Request'}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  Please select a reason
                </Text>

                <View style={{ marginTop: 14, gap: 10 }}>
                  {reasons.map((reason) => {
                    const active = selectedReason === reason;
                    return (
                      <TouchableOpacity
                        key={reason}
                        onPress={() => setSelectedReason(reason)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: active ? colors.dark : colors.gray400,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.dark }} /> : null}
                        </View>
                        <Text style={{ fontFamily: typography.fonts.regular, fontSize: 14, color: colors.dark }}>{reason}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedReason === 'Other' ? (
                  <TextInput
                    value={reasonDetails}
                    onChangeText={setReasonDetails}
                    placeholder="Please add details"
                    placeholderTextColor={colors.gray500}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={{
                      marginTop: 12,
                      minHeight: 80,
                      borderWidth: 1,
                      borderColor: colors.gray300,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontFamily: typography.fonts.regular,
                      fontSize: 13,
                      color: colors.dark,
                    }}
                  />
                ) : null}

                <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={closeReasonModal}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.gray300,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.white,
                    }}
                  >
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!canConfirmReason || busyAction === 'confirm-reason'}
                    onPress={handleConfirmReason}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: canConfirmReason ? colors.dark : colors.gray300,
                    }}
                  >
                    {busyAction === 'confirm-reason' ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={{ fontFamily: typography.fonts.medium, color: canConfirmReason ? colors.white : colors.gray600 }}>
                        Confirm
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverDeliveryDetailScreen;
