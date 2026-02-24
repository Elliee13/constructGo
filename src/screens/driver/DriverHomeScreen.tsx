import React, { useEffect, useMemo } from 'react';
import { Image, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { DriverTabsParamList } from '../../navigation/DriverTabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useDriverProfileStore } from '../../stores/driverProfileStore';
import { useDriverOrdersStore } from '../../stores/driverOrdersStore';
import { useNotificationStore } from '../../stores/notificationStore';
import IconBadge from '../../components/IconBadge';
import { formatPrice } from '../../utils/format';

const DriverHomeScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<DriverTabsParamList>>();
  const unreadCountDriver = useNotificationStore((s) => s.unreadCountDriver);
  const notifications = useNotificationStore((s) => s.notifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const online = useDriverProfileStore((s) => s.online);
  const setOnline = useDriverProfileStore((s) => s.setOnline);
  const deliveriesCount = useDriverProfileStore((s) => s.deliveriesCount);
  const onlineTimeMinutes = useDriverProfileStore((s) => s.onlineTimeMinutes);
  const ratingAvg = useDriverProfileStore((s) => s.ratingAvg);
  const syncRatingFromDriverStore = useDriverProfileStore((s) => s.syncRatingFromDriverStore);
  const driverId = useDriverProfileStore((s) => s.driverId);
  const requestQueue = useDriverOrdersStore((s) => s.requestQueue);
  const refreshFromOrders = useDriverOrdersStore((s) => s.refreshFromOrders);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const onlineTimeText = useMemo(() => `${Math.floor(onlineTimeMinutes / 60)}h ${onlineTimeMinutes % 60} min`, [onlineTimeMinutes]);
  const featuredRequest = requestQueue[0];

  useEffect(() => {
    syncRatingFromDriverStore(driverId);
  }, [driverId, syncRatingFromDriverStore]);

  useEffect(() => {
    refreshFromOrders();
  }, [refreshFromOrders]);

  useEffect(() => {
    if (requestQueue.length === 0) return;
    const hasExisting = notifications.some(
      (item) => item.scope === 'driver' && item.status === 'Request'
    );
    if (hasExisting) return;
    const first = requestQueue[0];
    addNotification({
      scope: 'driver',
      orderId: first.id,
      title: 'New Delivery Request',
      message: `${first.orderCode} is waiting for acceptance.`,
      status: 'Request',
    });
  }, [addNotification, notifications, requestQueue]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fonts.bold, fontSize: 30, color: colors.yellow }}>ConstructGo</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Account', { screen: 'DriverNotifications' } as any)}>
              <IconBadge icon={<Ionicons name="notifications-outline" size={22} color={colors.dark} />} count={unreadCountDriver > 0 ? unreadCountDriver : undefined} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.yellow }}>
              • {requestQueue.length} Delivery Request{requestQueue.length === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={{ marginTop: 14, borderRadius: 14, backgroundColor: colors.yellow, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.bold, fontSize: 22, color: colors.dark }}>
                {online ? "You're Online" : "You're Offline"}
              </Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                Ready to accept and deliver orders in your area.
              </Text>
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>
                  Availability
                </Text>
                <Switch value={online} onValueChange={setOnline} thumbColor={colors.white} trackColor={{ false: '#8D8D8D', true: colors.dark }} />
              </View>
            </View>
            <View style={{ width: 84, height: 84, borderRadius: 16, backgroundColor: '#F4C84E', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bicycle" size={36} color={colors.dark} />
            </View>
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200, padding: 10 }}>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Deliveries</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>{deliveriesCount}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200, padding: 10 }}>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Online Time</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>{onlineTimeText}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200, padding: 10 }}>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Rating</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>{ratingAvg.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={{ marginTop: 18, fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>
            Requests
          </Text>

          {featuredRequest ? (
            <View style={{ marginTop: 10, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.gray200, padding: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.white }}>
                  {featuredRequest.image ? <Image source={{ uri: featuredRequest.image }} style={{ width: '100%', height: '100%' }} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 15, color: colors.dark }}>{featuredRequest.productName}</Text>
                  <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                    {featuredRequest.orderCode}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                    TOTAL: {formatPrice(featuredRequest.total)}
                  </Text>
                  <View style={{ marginTop: 6, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FFF2C6', paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#B37B00' }}>COD</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    'Account',
                    { screen: 'DriverDeliveryDetail', params: { orderId: featuredRequest.id } } as never
                  )
                }
                style={{ marginTop: 10, alignSelf: 'flex-end' }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>More</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200, padding: 14, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={26} color={colors.gray500} />
              <Text style={{ marginTop: 6, fontFamily: typography.fonts.medium, fontSize: 13, color: colors.gray600 }}>
                No new requests right now.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverHomeScreen;

