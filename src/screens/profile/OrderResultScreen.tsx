import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useDriverStore } from '../../stores/driverStore';
import { useCatalogStore } from '../../stores/catalogStore';
import { useToastStore } from '../../stores/toastStore';
import useHideTabs from '../../navigation/useHideTabs';
import { formatPrice } from '../../utils/format';

type ResultRouteParams = { orderId: string; status: 'Delivered' | 'Cancelled' };

const checklistRows = [
  { key: 'correctModel', label: 'Correct model/specifications' },
  { key: 'goodCondition', label: 'Good condition (no damage)' },
  { key: 'accessoriesIncluded', label: 'All accessories included' },
  { key: 'packagingSecure', label: 'Packaging was appropriate and secure' },
] as const;

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const transactionIdFor = (orderId?: string) => {
  if (!orderId) return 'TXN-000000';
  const trimmed = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `TXN-${trimmed.padStart(6, '0')}`;
};

const OrderResultScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<any>();
  const { orderId, status } = route.params as ResultRouteParams;

  const order = useOrderStore((state) => state.orders.find((item) => item.id === orderId));
  const saveDeliveryReview = useOrderStore((state) => state.saveDeliveryReview);
  const updateVerifyChecklist = useOrderStore((state) => state.updateVerifyChecklist);
  const setReportIssue = useOrderStore((state) => state.setReportIssue);

  const products = useCatalogStore((state) => state.products);
  const ensureDriverFromOrder = useDriverStore((state) => state.ensureDriverFromOrder);
  const submitDriverRating = useDriverStore((state) => state.submitDriverRating);
  const driver = useDriverStore((state) => (order ? state.drivers[order.driverId] : undefined));

  const showToast = useToastStore((state) => state.showToast);

  const [rating, setRating] = useState(order?.deliveryRating ?? 0);
  const [feedback, setFeedback] = useState(order?.deliveryFeedback ?? '');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  useEffect(() => {
    if (!order) return;
    ensureDriverFromOrder(order);
    setRating(order.deliveryRating ?? 0);
    setFeedback(order.deliveryFeedback ?? '');
  }, [order, ensureDriverFromOrder]);

  const isDelivered = status === 'Delivered';
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const insets = useSafeAreaInsets();
  const stickyBottom = Math.max(insets.bottom + 8, 16);
  const stickyHeight = 58;

  const listedItems = useMemo(() => {
    if (!order) return [];
    return order.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return {
        key: item.cartItemId,
        name: product?.name ?? item.productName ?? 'Order Item',
        model: product?.model ?? '-',
        qty: item.qty,
        total: item.itemTotal,
        optionsLabel:
          item.selectedOptions && item.selectedOptions.length > 0
            ? item.selectedOptions.map((option) => `${option.groupName}: ${option.label}`).join(', ')
            : '',
      };
    });
  }, [order, products]);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { paddingTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>
            Order not found
          </Text>
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

  const checklist = order.verifyChecklist ?? {
    correctModel: false,
    goodCondition: false,
    accessoriesIncluded: false,
    packagingSecure: false,
  };
  const paymentMethod = (order.paymentMethod ?? '').toLowerCase();
  const fallbackPayment = (order.payment ?? '').toLowerCase();
  const paymentLabel =
    paymentMethod === 'gcash' || fallbackPayment.includes('gcash')
      ? 'GCash'
      : paymentMethod === 'maya' || fallbackPayment.includes('maya')
        ? 'Maya'
        : 'COD';

  const handleSubmitRating = () => {
    if (rating < 1) {
      showToast({
        type: 'warning',
        title: 'Rating required',
        message: 'Select a star rating before submitting.',
      });
      return;
    }

    if (order.deliveryRating) {
      saveDeliveryReview(order.id, order.deliveryRating, feedback.trim());
      showToast({
        type: 'info',
        title: 'Already submitted',
        message: 'Your rating is already saved for this order.',
      });
      return;
    }

    if (isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      submitDriverRating(order.driverId, rating);
      saveDeliveryReview(order.id, rating, feedback.trim());

      showToast({
        type: 'success',
        title: 'Rating submitted',
        message: 'Thanks! Rating submitted.',
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleReportIssue = () => {
    if (isReportingIssue) return;
    setIsReportingIssue(true);
    const next = !order.reportIssue;
    setReportIssue(order.id, next);
    showToast({
      type: next ? 'error' : 'info',
      title: next ? 'Issue reported' : 'Issue cleared',
      message: next ? 'Issue reported.' : 'Issue status reset.',
    });
    setIsReportingIssue(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: stickyBottom + stickyHeight + 24 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <View
            style={{
              borderRadius: radii.lg,
              padding: 14,
              backgroundColor: isDelivered ? '#FFE9A6' : '#FDE7E7',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDelivered ? '#FFF6D9' : '#FAD1D1',
                }}
              >
                <Ionicons
                  name={isDelivered ? 'checkmark' : 'close'}
                  size={18}
                  color={isDelivered ? '#2E7D32' : '#B3261E'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typography.fonts.bold, fontSize: 22, color: colors.dark }}>
                  {isDelivered ? 'Order Delivered!' : 'Order Cancelled'}
                </Text>
                <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray700 }}>
                  {isDelivered
                    ? `Your order has been delivered on ${formatDateTime(order.createdAt)}.`
                    : 'Your order was cancelled successfully.'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 15, color: colors.dark }}>
              Delivery Confirmation
            </Text>
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Order #: {order.code}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Delivered to: User, Example
            </Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Address: {order.address}
            </Text>
            <View
              style={{
                marginTop: 10,
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: isDelivered ? '#DFF2E1' : '#FCE8E8',
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fonts.medium,
                  fontSize: 11,
                  color: isDelivered ? '#2E7D32' : '#B3261E',
                }}
              >
                {isDelivered ? 'Delivered' : 'Cancelled'}
              </Text>
            </View>
            {!isDelivered ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: '#B3261E' }}>
                  Reason: {order.cancelReason ?? 'Cancelled by user'}
                </Text>
                {order.cancelReasonDetails ? (
                  <Text style={{ marginTop: 4, marginLeft: 8, fontFamily: typography.fonts.regular, fontSize: 12, color: '#B3261E' }}>
                    Other: {order.cancelReasonDetails}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {isDelivered ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('DriverProfile', { driverId: order.driverId, orderId: order.id })}
              style={{
                marginTop: 14,
                borderWidth: 1,
                borderColor: colors.gray200,
                borderRadius: radii.lg,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.gray200,
                }}
              >
                <Ionicons name="person" size={22} color={colors.gray600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{order.driverName}</Text>
                <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  Professional Driver
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={15} color={colors.yellow} />
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>
                  {(driver?.ratingAvg ?? order.driverRatingBase).toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {isDelivered ? (
            <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Verify your items</Text>
              <View style={{ marginTop: 10, gap: 8 }}>
                {listedItems.map((item) => (
                  <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>{item.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                        Model: {item.model}
                      </Text>
                      {item.optionsLabel ? (
                        <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                          {item.optionsLabel}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>x{item.qty}</Text>
                  </View>
                ))}
              </View>

              <View style={{ marginTop: 12, gap: 10 }}>
                {checklistRows.map((row) => {
                  const checked = checklist[row.key];
                  return (
                    <TouchableOpacity
                      key={row.key}
                      onPress={() => updateVerifyChecklist(order.id, { [row.key]: !checked })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: checked ? colors.dark : colors.gray400,
                          backgroundColor: checked ? colors.dark : colors.white,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                      </View>
                      <Text style={{ flex: 1, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                        {row.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Order Summary</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {listedItems.map((item) => (
                <View key={`${item.key}-sum`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                      {item.name} x{item.qty}
                    </Text>
                    {item.optionsLabel ? (
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                        {item.optionsLabel}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                    {formatPrice(item.total)}
                  </Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.gray200, marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Items</Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{formatPrice(order.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Delivery fee</Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{formatPrice(order.deliveryFee + order.deliveryOptionFee)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>Total Paid</Text>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>{formatPrice(order.total)}</Text>
              </View>
              <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Payment</Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{paymentLabel}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Transaction ID</Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{transactionIdFor(order.id)}</Text>
              </View>
            </View>
          </View>

          {isDelivered ? (
            <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Rate Your Experience</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                How was your delivery?
              </Text>

              <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity key={value} onPress={() => setRating(value)}>
                    <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={24} color={colors.yellow} />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Share your delivery feedback"
                placeholderTextColor={colors.gray500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{
                  marginTop: 12,
                  minHeight: 92,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.gray300,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontFamily: typography.fonts.regular,
                  fontSize: 12,
                  color: colors.dark,
                }}
              />

              <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={handleSubmitRating}
                  disabled={isSubmittingRating}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: colors.dark,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Submit</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReportIssue}
                  disabled={isReportingIssue}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: order.reportIssue ? '#FCE8E8' : '#FFF2C6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isReportingIssue ? (
                    <ActivityIndicator size="small" color={order.reportIssue ? '#B3261E' : '#B37B00'} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: typography.fonts.medium,
                        color: order.reportIssue ? '#B3261E' : '#B37B00',
                      }}
                    >
                      Report Issues
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: stickyBottom }}>
        <TouchableOpacity
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [
                { name: 'AccountHome' },
                { name: 'MyOrders', params: { tab: 'History' } as any },
              ],
            })
          }
          style={{
            height: stickyHeight,
            borderRadius: 12,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OrderResultScreen;
