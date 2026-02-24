import React, { useMemo } from 'react';
import { FlatList, Platform, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useNotificationStore } from '../../stores/notificationStore';
import useHideTabs from '../../navigation/useHideTabs';

const StoreOwnerNotificationsScreen = () => {
  useHideTabs('StoreOwnerTabs');
  const navigation = useNavigation<any>();
  const allNotifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const notifications = useMemo(
    () => allNotifications.filter((item) => item.scope === 'store_owner'),
    [allNotifications]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 12, paddingBottom: 12 }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Notifications</Text>
          <TouchableOpacity onPress={() => markAllRead('store_owner')}>
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Mark all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }}
        ListEmptyComponent={
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Ionicons name="notifications-outline" size={30} color={colors.gray500} />
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, color: colors.gray600 }}>No notifications yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              markRead(item.id);
              navigation.navigate('Orders', { screen: 'StoreOwnerOrderDetail', params: { orderId: item.orderId } });
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              padding: 12,
              backgroundColor: item.isRead ? colors.white : colors.info,
            }}
          >
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>{item.title}</Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, color: colors.dark, fontSize: 12 }}>{item.message}</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray500, fontSize: 11 }}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default StoreOwnerNotificationsScreen;
