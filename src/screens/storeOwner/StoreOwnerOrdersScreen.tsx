import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useOrderStore, type Order } from '../../stores/orderStore';
import { formatPrice } from '../../utils/format';
import StatusPill from '../../components/ui/StatusPill';

const StoreOwnerOrdersScreen = () => {
  const navigation = useNavigation<any>();
  const orders = useOrderStore((s) => s.orders);
  const acceptStoreOrder = useOrderStore((s) => s.acceptStoreOrder);
  const rejectStoreOrder = useOrderStore((s) => s.rejectStoreOrder);
  const markPreparing = useOrderStore((s) => s.markPreparing);
  const markReadyForPickup = useOrderStore((s) => s.markReadyForPickup);
  const sendToDrivers = useOrderStore((s) => s.sendToDrivers);

  const [tab, setTab] = useState<'Incoming' | 'In Progress' | 'History'>('Incoming');
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const list = useMemo(() => {
    if (tab === 'Incoming') return orders.filter((order) => order.status === 'Pending');
    if (tab === 'In Progress') {
      return orders.filter((order) =>
        ['Processing', 'Preparing', 'Ready for Pickup', 'Driver Requested', 'Out for Delivery'].includes(order.status)
      );
    }
    return orders.filter((order) => ['Delivered', 'Cancelled'].includes(order.status));
  }, [orders, tab]);

  const nextAction = (order: Order) => {
    if (order.status === 'Processing') return { label: 'Mark Preparing', onPress: () => markPreparing(order.id) };
    if (order.status === 'Preparing') return { label: 'Mark Ready', onPress: () => markReadyForPickup(order.id) };
    if (order.status === 'Ready for Pickup') return { label: 'Send to Drivers', onPress: () => sendToDrivers(order.id) };
    return null;
  };

  const runAction = (key: string, action: () => unknown) => {
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
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Store Orders</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
            {(['Incoming', 'In Progress', 'History'] as const).map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item)}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                  backgroundColor: tab === item ? colors.dark : colors.gray100,
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
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>No orders in this tab.</Text>
              </View>
            ) : (
              list.map((order) => {
                const action = nextAction(order);
                return (
                  <View key={order.id} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>{order.code}</Text>
                      <StatusPill status={order.status} size="sm" />
                    </View>
                    <Text style={{ marginTop: 5, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{order.address}</Text>
                    <Text style={{ marginTop: 5, fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>
                      Total: {formatPrice(order.total)}
                    </Text>

                    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('StoreOwnerOrderDetail', { orderId: order.id })}
                      >
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>More</Text>
                      </TouchableOpacity>

                      {tab === 'Incoming' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            disabled={busyActionKey === `${order.id}:accept`}
                            onPress={() => runAction(`${order.id}:accept`, () => acceptStoreOrder(order.id))}
                            style={{ borderRadius: 8, backgroundColor: '#DFF2E1', paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            {busyActionKey === `${order.id}:accept` ? (
                              <ActivityIndicator size="small" color={colors.success} />
                            ) : (
                              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.success }}>Accept</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={busyActionKey === `${order.id}:reject`}
                            onPress={() => runAction(`${order.id}:reject`, () => rejectStoreOrder(order.id, 'Rejected by store owner'))}
                            style={{ borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            {busyActionKey === `${order.id}:reject` ? (
                              <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.error }}>Reject</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : tab === 'In Progress' && action ? (
                        <TouchableOpacity
                          disabled={busyActionKey === `${order.id}:${action.label}`}
                          onPress={() => runAction(`${order.id}:${action.label}`, action.onPress)}
                          style={{ borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 7 }}
                        >
                          {busyActionKey === `${order.id}:${action.label}` ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.white }}>{action.label}</Text>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
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

export default StoreOwnerOrdersScreen;
