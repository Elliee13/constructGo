import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import IconBadge from '../../components/IconBadge';
import { useNotificationStore } from '../../stores/notificationStore';
import { useDriverProfileStore } from '../../stores/driverProfileStore';
import { useAppRoleStore } from '../../stores/appRoleStore';
import type { DriverAccountStackParamList } from '../../navigation/DriverAccountStack';

const DriverAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DriverAccountStackParamList>>();
  const unreadDriver = useNotificationStore((s) => s.unreadCountDriver);
  const notifications = useNotificationStore((s) => s.notifications);
  const name = useDriverProfileStore((s) => s.name);
  const email = useDriverProfileStore((s) => s.email);
  const switchRole = useAppRoleStore((s) => s.switchRole);
  const signOutAll = useAppRoleStore((s) => s.signOutAll);

  const [allowNotifications, setAllowNotifications] = useState(true);
  const [allowEmails, setAllowEmails] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Filipino'>('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  useEffect(() => {
    AsyncStorage.multiGet(['driver-pref-notifications', 'driver-pref-emails', 'driver-pref-language']).then((rows) => {
      const map = Object.fromEntries(rows);
      if (map['driver-pref-notifications'] !== null) setAllowNotifications(map['driver-pref-notifications'] === 'true');
      if (map['driver-pref-emails'] !== null) setAllowEmails(map['driver-pref-emails'] === 'true');
      if (map['driver-pref-language'] === 'English' || map['driver-pref-language'] === 'Filipino') {
        setLanguage(map['driver-pref-language']);
      }
    });
  }, []);

  const persist = (key: string, value: string) => AsyncStorage.setItem(key, value);

  const handleSwitchRole = () => {
    switchRole();
  };

  const handleSignOutAll = async () => {
    await signOutAll();
  };

  const driverNotifCount = notifications.filter((item) => item.scope === 'driver' && !item.isRead).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 22, color: colors.dark }}>{name}</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>{email}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('DriverNotifications')}>
              <IconBadge icon={<Ionicons name="notifications-outline" size={22} color={colors.dark} />} count={unreadDriver > 0 ? unreadDriver : driverNotifCount > 0 ? driverNotifCount : undefined} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 14, borderRadius: 12, backgroundColor: colors.yellow, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.bold, fontSize: 22, color: colors.dark }}>Fast Hardware Delivery</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>Driver tools and dispatch updates</Text>
              <View style={{ marginTop: 10, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Order Now</Text>
              </View>
            </View>
            <Ionicons name="speedometer" size={42} color={colors.dark} />
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
            {[
              { label: 'Deliveries', screen: 'Deliveries', icon: 'cube-outline' },
              { label: 'Wallet', screen: 'Wallet', icon: 'wallet-outline' },
              { label: 'Settings', screen: 'Settings', icon: 'settings-outline' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.screen as keyof DriverAccountStackParamList)}
                style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.gray200, paddingVertical: 12, alignItems: 'center' }}
              >
                <Ionicons name={item.icon as any} size={18} color={colors.dark} />
                <Text style={{ marginTop: 6, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 22 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Translation</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(true)} style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="language" size={18} color={colors.dark} />
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{language}</Text>
              </View>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>More</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Additional</Text>
            <View style={{ marginTop: 10, gap: 12 }}>
              {[
                { label: 'Allow Notifications', value: allowNotifications, key: 'driver-pref-notifications', setter: setAllowNotifications },
                { label: 'Allow Emails', value: allowEmails, key: 'driver-pref-emails', setter: setAllowEmails },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => {
                    const next = !item.value;
                    item.setter(next as any);
                    persist(item.key, String(next));
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ width: 22, height: 22, borderWidth: 2, borderColor: colors.dark, backgroundColor: item.value ? colors.dark : colors.white }} />
                  <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <AppButton title="Switch Role" onPress={handleSwitchRole} />
            <TouchableOpacity onPress={handleSignOutAll} style={{ marginTop: 10, alignSelf: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.gray600 }}>
                Sign out completely
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={showLanguageModal} animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 }}
        >
          <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16 }}>
            {['English', 'Filipino'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setLanguage(item as 'English' | 'Filipino');
                  persist('driver-pref-language', item);
                  setShowLanguageModal(false);
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverAccountScreen;


