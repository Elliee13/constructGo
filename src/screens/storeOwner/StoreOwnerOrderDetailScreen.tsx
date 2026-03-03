import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import { useProductStore } from '../../stores/productStore';
import { useToastStore } from '../../stores/toastStore';
import { formatPrice } from '../../utils/format';
import MapPlaceholder from '../../components/MapPlaceholder';
import useHideTabs from '../../navigation/useHideTabs';

const StoreOwnerOrderDetailScreen = () => {
  useHideTabs('StoreOwnerTabs');
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;

  const order = useOrderStore((s) => s.orders.find((item) => item.id === orderId));
  const products = useProductStore((s) => s.products);
  const acceptStoreOrder = useOrderStore((s) => s.acceptStoreOrder);
  const rejectStoreOrder = useOrderStore((s) => s.rejectStoreOrder);
  const markPreparing = useOrderStore((s) => s.markPreparing);
  const markReadyForPickup = useOrderStore((s) => s.markReadyForPickup);
  const sendToDrivers = useOrderStore((s) => s.sendToDrivers);
  const setPackedQty = useOrderStore((s) => s.setPackedQty);
  const togglePackedLine = useOrderStore((s) => s.togglePackedLine);
  const proposeSubstitution = useOrderStore((s) => s.proposeSubstitution);
  const showToast = useToastStore((s) => s.showToast);

  const [subModalLineKey, setSubModalLineKey] = useState<string | null>(null);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');
  const [proposedQty, setProposedQty] = useState(1);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const insets = useSafeAreaInsets();

  const productMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);

  const action = useMemo(() => {
    if (!order) return null;
    if (order.status === 'Pending') return { label: 'Accept Order', onPress: () => acceptStoreOrder(order.id) };
    if (order.status === 'Processing') return { label: 'Mark Preparing', onPress: () => markPreparing(order.id) };
    if (order.status === 'Preparing') return { label: 'Mark Ready for Pickup', onPress: () => markReadyForPickup(order.id) };
    if (order.status === 'Ready for Pickup') return { label: 'Send to Drivers', onPress: () => sendToDrivers(order.id) };
    return null;
  }, [acceptStoreOrder, markPreparing, markReadyForPickup, order, sendToDrivers]);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { paddingTop: 20 }]}> 
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

  const totalPacked = order.items.reduce(
    (sum, item) => sum + Math.min(item.qty, order.pack.items[item.cartItemId]?.packedQty ?? 0),
    0
  );
  const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
  const hasPendingSubstitutions = Object.values(order.substitutions).some((entry) => entry.status === 'proposed');

  const isReadyAction = action?.label === 'Mark Ready for Pickup';
  const readyBlocked = isReadyAction && (!order.pack.allPacked || hasPendingSubstitutions);

  const activeLine = subModalLineKey ? order.items.find((item) => item.cartItemId === subModalLineKey) : undefined;
  const activeSub = subModalLineKey ? order.substitutions[subModalLineKey] : undefined;
  const activeProduct = activeLine ? productMap.get(activeSub?.originalProductId ?? activeLine.productId) : undefined;
  const candidateSubstitutes = activeProduct
    ? products.filter((item) => item.category === activeProduct.category && item.id !== activeProduct.id)
    : [];

  const openSubModal = (lineKey: string) => {
    const line = order.items.find((item) => item.cartItemId === lineKey);
    if (!line) return;

    const substitution = order.substitutions[lineKey];
    const originalId = substitution?.originalProductId ?? line.productId;
    const original = productMap.get(originalId);
    const candidates = products.filter((item) => item.category === original?.category && item.id !== originalId);

    setSubModalLineKey(lineKey);
    setSelectedSubstituteId(substitution?.substituteProductId ?? candidates[0]?.id ?? '');
    setProposedQty(substitution?.proposedQty ?? line.qty);
  };

  const closeSubModal = () => {
    setSubModalLineKey(null);
    setSelectedSubstituteId('');
    setProposedQty(1);
  };

  const confirmProposeSubstitution = () => {
    if (busyAction === `substitute:${subModalLineKey}`) return;
    if (!subModalLineKey || !selectedSubstituteId) {
      showToast({ type: 'warning', title: 'Select substitute', message: 'Please choose a substitute item.' });
      return;
    }

    const actionKey = `substitute:${subModalLineKey}`;
    setBusyAction(actionKey);
    try {
      const ok = proposeSubstitution(order.id, subModalLineKey, selectedSubstituteId, proposedQty);
      if (ok) closeSubModal();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 86, 132) }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>

          <Text style={{ marginTop: 12, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Order Detail</Text>
          <Text style={{ marginTop: 4, fontFamily: typography.fonts.medium, color: colors.dark }}>{order.code}</Text>

          <View style={{ marginTop: 12 }}>
            <MapPlaceholder height={170} />
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, color: colors.gray600 }}>{order.address}</Text>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Items</Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {order.items.map((item) => {
                const product = productMap.get(item.productId);
                const productName = product?.name ?? item.productName ?? 'Item';
                return (
                  <View key={item.cartItemId} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{productName}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Qty: {item.qty}</Text>
                    </View>
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(item.itemTotal)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={{ height: 1, backgroundColor: colors.gray200, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Subtotal</Text>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>Delivery fee</Text>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(order.deliveryFee + order.deliveryOptionFee)}</Text>
            </View>
            <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Total</Text>
              <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{formatPrice(order.total)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Pick & Pack</Text>
              {order.pack.allPacked ? (
                <View style={{ borderRadius: 10, backgroundColor: '#DFF2E1', paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#2E7D32' }}>All packed</Text>
                </View>
              ) : null}
            </View>

            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Packed {totalPacked}/{totalQty} items
            </Text>

            <View style={{ marginTop: 10, gap: 10 }}>
              {order.items.map((item) => {
                const product = productMap.get(item.productId);
                const productImage = product?.image ?? item.productImage;
                const productName = product?.name ?? item.productName ?? 'Item';
                const packedQty = Math.min(item.qty, order.pack.items[item.cartItemId]?.packedQty ?? 0);
                const substitution = order.substitutions[item.cartItemId];
                const substitute = substitution?.substituteProductId ? productMap.get(substitution.substituteProductId) : undefined;

                return (
                  <View key={item.cartItemId} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.white }}>
                        {productImage ? <Image source={{ uri: productImage }} style={{ width: '100%', height: '100%' }} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{productName}</Text>
                        <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                          x{item.qty}
                        </Text>
                        {item.selectedOptions?.length ? (
                          <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                            {item.selectedOptions.map((opt) => `${opt.groupName}: ${opt.label}`).join(' • ')}
                          </Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        onPress={() => togglePackedLine(order.id, item.cartItemId)}
                        style={{ width: 22, height: 22, borderWidth: 2, borderColor: colors.dark, backgroundColor: packedQty === item.qty ? colors.dark : colors.white }}
                      />
                    </View>

                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => setPackedQty(order.id, item.cartItemId, packedQty - 1)}
                        disabled={packedQty <= 0}
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: packedQty <= 0 ? colors.gray100 : colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="remove" size={14} color={colors.dark} />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>
                        {packedQty}/{item.qty}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setPackedQty(order.id, item.cartItemId, packedQty + 1)}
                        disabled={packedQty >= item.qty}
                        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: packedQty >= item.qty ? colors.gray100 : colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="add" size={14} color={colors.dark} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 10, gap: 8 }}>
                      {substitution?.status === 'proposed' ? (
                        <View style={{ borderRadius: 8, backgroundColor: '#FFF2C6', padding: 8 }}>
                          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: '#B37B00' }}>Waiting for customer response</Text>
                          <Text style={{ marginTop: 3, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                            Proposed: {substitute?.name ?? 'Unavailable item'} x{substitution.proposedQty ?? item.qty}
                          </Text>
                        </View>
                      ) : substitution?.status === 'accepted' ? (
                        <View style={{ alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#DFF2E1', paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#2E7D32' }}>Substitute accepted</Text>
                        </View>
                      ) : substitution?.status === 'rejected' ? (
                        <View style={{ alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#B3261E' }}>Substitute rejected</Text>
                        </View>
                      ) : null}

                      {order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
                        <TouchableOpacity
                          onPress={() => openSubModal(item.cartItemId)}
                          style={{ alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 10, paddingVertical: 6 }}
                        >
                          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.white }}>
                            {substitution?.status === 'none' ? 'Propose Substitute' : 'Update Substitute'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
            {!hasPendingSubstitutions ? (
              <Text style={{ marginTop: 10, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                No substitutions pending.
              </Text>
            ) : null}
          </View>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Status Timeline</Text>
            {['Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Driver Requested', 'Out for Delivery', 'Delivered'].map((step) => (
              <View key={step} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: order.status === step ? colors.dark : colors.gray300 }} />
                <Text style={{ fontFamily: typography.fonts.regular, color: order.status === step ? colors.dark : colors.gray600 }}>{step}</Text>
              </View>
            ))}
          </View>

          {order.status === 'Pending' ? (
            <TouchableOpacity
              disabled={busyAction === `reject:${order.id}`}
              onPress={() => {
                const key = `reject:${order.id}`;
                setBusyAction(key);
                try {
                  rejectStoreOrder(order.id, 'Rejected by store owner');
                } finally {
                  setBusyAction(null);
                }
              }}
              style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 12, paddingVertical: 8 }}
            >
              {busyAction === `reject:${order.id}` ? (
                <ActivityIndicator size="small" color="#B3261E" />
              ) : (
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: '#B3261E' }}>Reject</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {action ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom + 8, 16) }}>
          <TouchableOpacity
            disabled={busyAction === `next:${order.id}`}
            onPress={() => {
              if (readyBlocked) {
                showToast({
                  type: 'warning',
                  title: 'Cannot proceed',
                  message: hasPendingSubstitutions
                    ? 'Resolve all substitutions before marking Ready'
                    : 'Pack all items before marking Ready',
                });
                return;
              }
              const key = `next:${order.id}`;
              setBusyAction(key);
              try {
                action.onPress();
              } finally {
                setBusyAction(null);
              }
            }}
            style={{
              height: 56,
              borderRadius: 56,
              backgroundColor: readyBlocked || busyAction === `next:${order.id}` ? colors.gray300 : colors.dark,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {busyAction === `next:${order.id}` ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={{ fontFamily: typography.fonts.semibold, color: readyBlocked ? colors.gray600 : colors.white }}>{action.label}</Text>
            )}
          </TouchableOpacity>
          {readyBlocked ? (
            <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
              {hasPendingSubstitutions
                ? 'Resolve proposed substitutions before readying the order.'
                : 'Complete packing before marking order ready.'}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom + 8, 16) }}>
          <View style={{ borderRadius: 10, backgroundColor: colors.gray100, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.gray600 }}>Order is closed or in driver flow.</Text>
          </View>
        </View>
      )}

      <Modal transparent visible={Boolean(subModalLineKey)} animationType="fade" onRequestClose={closeSubModal}>
        <TouchableWithoutFeedback onPress={closeSubModal}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '72%' }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Propose Substitute</Text>
                <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  Select a replacement product and quantity.
                </Text>

                <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
                  {candidateSubstitutes.map((item) => {
                    const selected = selectedSubstituteId === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => setSelectedSubstituteId(item.id)}
                        style={{
                          borderWidth: 1,
                          borderColor: selected ? colors.dark : colors.gray200,
                          borderRadius: 10,
                          padding: 10,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{item.name}</Text>
                          <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                            Stock: {item.stock}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{formatPrice(item.price)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>Qty</Text>
                  <TouchableOpacity
                    onPress={() => setProposedQty((prev) => Math.max(1, prev - 1))}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="remove" size={14} color={colors.dark} />
                  </TouchableOpacity>
                  <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{proposedQty}</Text>
                  <TouchableOpacity
                    onPress={() => setProposedQty((prev) => prev + 1)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="add" size={14} color={colors.dark} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={closeSubModal}
                    style={{ flex: 1, height: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmProposeSubstitution}
                    disabled={busyAction === `substitute:${subModalLineKey}`}
                    style={{ flex: 1, height: 46, borderRadius: 10, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {busyAction === `substitute:${subModalLineKey}` ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Confirm</Text>
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

export default StoreOwnerOrderDetailScreen;

