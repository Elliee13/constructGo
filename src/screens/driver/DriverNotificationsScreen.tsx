import React, { useMemo } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverAccountStackParamList } from '../../navigation/DriverAccountStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useNotificationStore } from '../../stores/notificationStore';

const formatTime = (iso: string) => new Date(iso).toLocaleString();

const DriverNotificationsScreen = () => {
  useHideTabs('DriverTabs');
  const navigation = useNavigation<NativeStackNavigationProp<DriverAccountStackParamList>>();
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const driverNotifications = useMemo(
    () => notifications.filter((item) => item.scope === 'driver'),
    [notifications]
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
          <TouchableOpacity onPress={() => markAllRead('driver')}>
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Mark all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={driverNotifications}
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
            onPress={() => markRead(item.id)}
            style={{
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: 12,
              padding: 12,
              backgroundColor: item.isRead ? colors.white : colors.info,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 13, color: colors.dark }}>{item.title}</Text>
              {!item.isRead ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow }} /> : null}
            </View>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, color: colors.dark, fontSize: 12 }}>{item.message}</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray500, fontSize: 11 }}>{formatTime(item.createdAt)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default DriverNotificationsScreen;


