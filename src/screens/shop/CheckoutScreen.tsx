import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useOrderStore } from '../../stores/orderStore';
import { useToastStore } from '../../stores/toastStore';
import useHideTabs from '../../navigation/useHideTabs';
import { formatPrice } from '../../utils/format';
import { createCheckout, getOrderStatus, type BackendOrderStatus } from '../../api/paymentsService';

const DELIVERY_OPTIONS = [
  { label: 'Priority', fee: 50 },
  { label: 'Standard', fee: 30 },
  { label: 'Saver', fee: 20 },
  { label: 'Order for Later', fee: 0 },
];

const CheckoutScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const cartItemIds: string[] = route.params?.cartItemIds ?? [];
  const items = useCartStore((s) => s.items);
  const clearAfterOrder = useCartStore((s) => s.clearAfterOrder);
  const syncWithInventory = useCartStore((s) => s.syncWithInventory);
  const products = useProductStore((s) => s.products);
  const createOrderFromCart = useOrderStore((s) => s.createOrderFromCart);
  const attachPaymentMeta = useOrderStore((s) => s.attachPaymentMeta);
  const updatePaymentStatusByBackendOrderId = useOrderStore((s) => s.updatePaymentStatusByBackendOrderId);
  const showToast = useToastStore((s) => s.showToast);

  const [deliveryOption, setDeliveryOption] = useState(DELIVERY_OPTIONS[1]);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'gcash' | 'maya'>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    AsyncStorage.getItem('address-info').then((raw) => {
      if (raw) {
        const data = JSON.parse(raw);
        setAddress(`${data.businessName}, ${data.houseNumber} ${data.street}`);
      }
    });
  }, []);

  React.useEffect(() => {
    syncWithInventory();
  }, [products, syncWithInventory]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const selectedItems = useMemo(() => {
    if (cartItemIds.length === 0) return items;
    return items.filter((item) => cartItemIds.includes(item.id));
  }, [items, cartItemIds]);

  const unitPrice = (productId: string, selectedOptions?: any[]) => {
    const product = productMap.get(productId);
    const base = product?.price ?? 0;
    const optionsTotal = selectedOptions?.reduce((sum: number, opt: any) => sum + (opt.priceDelta ?? 0), 0) ?? 0;
    return base + optionsTotal;
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + unitPrice(item.productId, item.selectedOptions) * item.qty, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee + deliveryOption.fee;
  const amountCents = Math.max(2000, Math.round(total * 100));

  const validateStock = () => {
    if (selectedItems.length === 0) {
      return { ok: false, message: 'No items selected for checkout.' };
    }

    for (const item of selectedItems) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        return { ok: false, message: `${product?.name ?? 'Item'} is unavailable` };
      }
      if (product.stock <= 0) {
        return { ok: false, message: `${product.name} is out of stock` };
      }
      if (product.stock < item.qty) {
        return { ok: false, message: `Only ${product.stock} left for ${product.name}` };
      }
    }

    return { ok: true as const };
  };

  const pollPaymentStatus = async (backendOrderId: string) => {
    const timeoutMs = 120000;
    const intervalMs = 3000;
    const started = Date.now();
    let latest: BackendOrderStatus = 'pending';

    while (Date.now() - started < timeoutMs) {
      const response = await getOrderStatus(backendOrderId);
      latest = response.status;
      updatePaymentStatusByBackendOrderId(backendOrderId, latest);
      if (latest === 'paid' || latest === 'failed') {
        return latest;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return latest;
  };

  const handlePlaceOrder = async () => {
    if (isPlacing) return;

    const validation = validateStock();
    if (!validation.ok) {
      showToast({ type: 'warning', title: 'Checkout blocked', message: validation.message });
      navigation.goBack();
      return;
    }

    setIsPlacing(true);
    const paymentLabel =
      paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'maya' ? 'Maya' : 'Cash on Delivery';
    const order = createOrderFromCart(selectedItems, deliveryOption.label, address, paymentLabel, unitPrice);

    if (!order) {
      setIsPlacing(false);
      return;
    }
    if (paymentMethod === 'cod') {
      clearAfterOrder(selectedItems.map((item) => item.id));
      setIsPlacing(false);
      navigation.replace('LoadingOrder', { orderId: order.id });
      return;
    }

    try {
      const checkout = await createCheckout({
        localOrderId: order.id,
        localOrderCode: order.code,
        amountCents,
      });

      attachPaymentMeta(order.id, {
        backendOrderId: checkout.backendOrderId,
        paymentCheckoutUrl: checkout.checkoutUrl,
        paymentMethod,
        paymentStatus: 'pending',
      });

      clearAfterOrder(selectedItems.map((item) => item.id));
      await Linking.openURL(checkout.checkoutUrl);
      const paymentStatus = await pollPaymentStatus(checkout.backendOrderId);

      if (paymentStatus === 'paid') {
        showToast({
          type: 'success',
          title: 'Payment confirmed',
          message: `${order.code} payment received.`,
        });
        navigation.replace('LoadingOrder', { orderId: order.id });
        return;
      }

      showToast({
        type: 'warning',
        title: 'Payment pending',
        message: `Payment for ${order.code} is not confirmed yet.`,
      });
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Payment error',
        message: error instanceof Error ? error.message : 'Unable to start payment checkout.',
      });
      navigation.goBack();
    } finally {
      setIsPlacing(false);
    }
  };

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const stickyBottom = Math.max(insets.bottom + 8, 16);
  const stickyHeight = 58;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: stickyBottom + stickyHeight + 24 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>

          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Checkout</Text>

          <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Order Summary</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {selectedItems.map((item) => {
                const product = productMap.get(item.productId);
                return (
                  <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>{product?.name ?? 'Unavailable'} x{item.qty}</Text>
                      {item.selectedOptions && item.selectedOptions.length > 0 ? (
                        <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                          {item.selectedOptions.map((option) => `${option.groupName}: ${option.label}`).join(', ')}
                        </Text>
                      ) : null}
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                        In stock: {product?.stock ?? 0}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(unitPrice(item.productId, item.selectedOptions) * item.qty)}</Text>
                  </View>
                );
              })}
              <View style={{ height: 1, backgroundColor: colors.gray200, marginVertical: 6 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Subtotal</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Delivery fee</Text>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(deliveryFee)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Total</Text>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{formatPrice(total)}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Delivery Options</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {DELIVERY_OPTIONS.map((option) => {
                const isSelected = option.label === deliveryOption.label;
                return (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => setDeliveryOption(option)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.dark : colors.gray300,
                      backgroundColor: isSelected ? colors.dark : colors.white,
                    }}
                  >
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: isSelected ? colors.white : colors.dark }}>
                      {option.label} (+{formatPrice(option.fee)})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Address</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray600 }}>
              {address || 'No address set'}
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Payment</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setPaymentMethod('cod')}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: paymentMethod === 'cod' ? colors.dark : colors.gray300,
                  backgroundColor: paymentMethod === 'cod' ? colors.dark : colors.white,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.medium,
                    color: paymentMethod === 'cod' ? colors.white : colors.dark,
                  }}
                >
                  Cash on Delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentMethod('gcash')}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: paymentMethod === 'gcash' ? colors.dark : colors.gray300,
                  backgroundColor: paymentMethod === 'gcash' ? colors.dark : colors.white,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.medium,
                    color: paymentMethod === 'gcash' ? colors.white : colors.dark,
                  }}
                >
                  Pay with GCash
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaymentMethod('maya')}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: paymentMethod === 'maya' ? colors.dark : colors.gray300,
                  backgroundColor: paymentMethod === 'maya' ? colors.dark : colors.white,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.medium,
                    color: paymentMethod === 'maya' ? colors.white : colors.dark,
                  }}
                >
                  Pay with Maya
                </Text>
              </TouchableOpacity>
            </View>
            {paymentMethod !== 'cod' ? (
              <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, color: colors.gray600 }}>
                Checkout amount sent to backend: {formatPrice(amountCents / 100)}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: stickyBottom }}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacing || selectedItems.length === 0}
          style={{
            height: 58,
            borderRadius: 58,
            backgroundColor: isPlacing || selectedItems.length === 0 ? colors.gray300 : colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlacing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={{ fontFamily: typography.fonts.semibold, color: isPlacing || selectedItems.length === 0 ? colors.gray600 : colors.white }}>
              {paymentMethod === 'cod'
                ? 'Place Order'
                : paymentMethod === 'gcash'
                  ? 'Pay with GCash'
                  : 'Pay with Maya'}
            </Text>
          )}
        </TouchableOpacity>
        {selectedItems.length === 0 ? (
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
            Select at least one valid item to proceed.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
