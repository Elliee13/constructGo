import React, { useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverAccountStackParamList } from '../../navigation/DriverAccountStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useDriverOrdersStore } from '../../stores/driverOrdersStore';
import { formatPrice } from '../../utils/format';

const DriverDeliveriesScreen = () => {
  useHideTabs('DriverTabs');
  const navigation = useNavigation<NativeStackNavigationProp<DriverAccountStackParamList>>();
  const [tab, setTab] = useState<'Current' | 'History'>('Current');
  const activeDeliveries = useDriverOrdersStore((s) => s.activeDeliveries);
  const historyDeliveries = useDriverOrdersStore((s) => s.historyDeliveries);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const history = useMemo(
    () => historyDeliveries.filter((order) => order.status === 'Delivered' || order.status === 'Cancelled'),
    [historyDeliveries]
  );
  const list = tab === 'Current' ? activeDeliveries : history;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ marginTop: 10, fontFamily: typography.fonts.semibold, fontSize: 22, color: colors.dark }}>Deliveries</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
            {['Current', 'History'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item as 'Current' | 'History')}
                style={{ flex: 1, borderRadius: 10, backgroundColor: tab === item ? colors.dark : colors.gray100, paddingVertical: 9, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: tab === item ? colors.white : colors.dark }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 14, gap: 12 }}>
            {list.length === 0 ? (
              <View style={{ borderRadius: radii.lg, borderWidth: 1, borderColor: colors.gray200, padding: 16, alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={26} color={colors.gray500} />
                <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>No deliveries to show.</Text>
              </View>
            ) : (
              list.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => navigation.navigate('DriverDeliveryDetail', { orderId: order.id })}
                  style={{ borderRadius: radii.lg, borderWidth: 1, borderColor: colors.gray200, padding: 12 }}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.white }}>
                      {order.image ? <Image source={{ uri: order.image }} style={{ width: '100%', height: '100%' }} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{order.productName}</Text>
                      <Text style={{ marginTop: 3, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>{order.orderCode}</Text>
                      <Text style={{ marginTop: 4, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{formatPrice(order.total)}</Text>
                    </View>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: order.status === 'Delivered' ? '#DFF2E1' : order.status === 'Cancelled' ? '#FCE8E8' : '#FFF2C6',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: typography.fonts.medium,
                          fontSize: 11,
                          color: order.status === 'Delivered' ? '#2E7D32' : order.status === 'Cancelled' ? '#B3261E' : '#B37B00',
                        }}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverDeliveriesScreen;


