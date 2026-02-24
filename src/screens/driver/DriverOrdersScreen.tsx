import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useDriverOrdersStore } from '../../stores/driverOrdersStore';
import { formatPrice } from '../../utils/format';
import type { DriverTabsParamList } from '../../navigation/DriverTabs';
import StatusPill from '../../components/ui/StatusPill';

const DriverOrdersScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<DriverTabsParamList>>();
  const [tab, setTab] = useState<'Current' | 'History'>('Current');
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const requestQueue = useDriverOrdersStore((s) => s.requestQueue);
  const activeDeliveries = useDriverOrdersStore((s) => s.activeDeliveries);
  const historyDeliveries = useDriverOrdersStore((s) => s.historyDeliveries);
  const acceptRequest = useDriverOrdersStore((s) => s.acceptRequest);
  const declineRequest = useDriverOrdersStore((s) => s.declineRequest);
  const markDelivered = useDriverOrdersStore((s) => s.markDelivered);
  const markCancelled = useDriverOrdersStore((s) => s.markCancelled);
  const refreshFromOrders = useDriverOrdersStore((s) => s.refreshFromOrders);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const currentList = useMemo(() => [...requestQueue, ...activeDeliveries], [requestQueue, activeDeliveries]);
  const list = tab === 'Current' ? currentList : historyDeliveries;

  useEffect(() => {
    refreshFromOrders();
  }, [refreshFromOrders]);

  const runAction = (key: string, action: () => void) => {
    if (busyActionKey === key) return;
    setBusyActionKey(key);
    try {
      action();
    } finally {
      setBusyActionKey(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Driver Orders</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
            {['Current', 'History'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item as 'Current' | 'History')}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingVertical: 9,
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

          <View style={{ marginTop: 14, gap: 12 }}>
            {list.length === 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 18, alignItems: 'center' }}>
                <Ionicons name="archive-outline" size={24} color={colors.gray500} />
                <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>
                  {tab === 'Current' ? 'No requests or active deliveries.' : 'No delivery history yet.'}
                </Text>
              </View>
            ) : (
              list.map((order) => (
                <View key={order.id} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 74, height: 74, borderRadius: 10, backgroundColor: colors.white, overflow: 'hidden' }}>
                      {order.image ? <Image source={{ uri: order.image }} style={{ width: '100%', height: '100%' }} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>{order.productName}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>{order.orderCode}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>Qty: {order.qty}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>Subtotal: {formatPrice(order.subtotal)}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>Delivery Fee: {formatPrice(order.deliveryFee)}</Text>
                      <Text style={{ marginTop: 3, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Total: {formatPrice(order.total)}</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate(
                          'Account',
                          { screen: 'DriverDeliveryDetail', params: { orderId: order.id } } as never
                        )
                      }
                    >
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>More</Text>
                    </TouchableOpacity>

                    {tab === 'Current' ? (
                      order.status === 'Request' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            disabled={busyActionKey === `${order.id}:accept`}
                            onPress={() => runAction(`${order.id}:accept`, () => acceptRequest(order.id))}
                            style={{ borderRadius: 8, backgroundColor: '#DFF2E1', paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            {busyActionKey === `${order.id}:accept` ? (
                              <ActivityIndicator size="small" color={colors.success} />
                            ) : (
                              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.success }}>Accept</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={busyActionKey === `${order.id}:decline`}
                            onPress={() => runAction(`${order.id}:decline`, () => declineRequest(order.id))}
                            style={{ borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            {busyActionKey === `${order.id}:decline` ? (
                              <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.error }}>Decline</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            disabled={busyActionKey === `${order.id}:delivered`}
                            onPress={() => runAction(`${order.id}:delivered`, () => markDelivered(order.id))}
                            style={{ borderRadius: 8, backgroundColor: '#DFF2E1', paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            {busyActionKey === `${order.id}:delivered` ? (
                              <ActivityIndicator size="small" color={colors.success} />
                            ) : (
                              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.success }}>Delivered</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={busyActionKey === `${order.id}:cancel`}
                            onPress={() => runAction(`${order.id}:cancel`, () => markCancelled(order.id))}
                            style={{ borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            {busyActionKey === `${order.id}:cancel` ? (
                              <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.error }}>Cancel</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )
                    ) : (
                      <StatusPill status={order.status} size="sm" />
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverOrdersScreen;
