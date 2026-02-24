import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import IconBadge from '../../components/IconBadge';
import { useFavouritesStore } from '../../stores/favouritesStore';
import { useCartStore } from '../../stores/cartStore';
import { useOrderStore } from '../../stores/orderStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAppRoleStore } from '../../stores/appRoleStore';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const insets = useSafeAreaInsets();
  const favouritesCount = useFavouritesStore((s) => s.favourites.length);
  const cartCount = useCartStore((s) => s.cartCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const orders = useOrderStore((s) => s.orders);
  const switchRole = useAppRoleStore((s) => s.switchRole);
  const signOutAll = useAppRoleStore((s) => s.signOutAll);
  const processingOrder = orders.some((order) => ['Driver Requested', 'Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(order.status));

  const [allowNotifications, setAllowNotifications] = useState(true);
  const [allowEmails, setAllowEmails] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Filipino'>('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const loadPrefs = useCallback(async () => {
    const notif = await AsyncStorage.getItem('pref-notifications');
    const emails = await AsyncStorage.getItem('pref-emails');
    const lang = await AsyncStorage.getItem('pref-language');
    if (notif !== null) setAllowNotifications(notif === 'true');
    if (emails !== null) setAllowEmails(emails === 'true');
    if (lang === 'English' || lang === 'Filipino') setLanguage(lang);
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const persistPrefs = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  };

  const handleSwitchRole = () => {
    switchRole();
  };

  const handleSignOutAll = async () => {
    await signOutAll();
  };

  const openCart = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Home', { screen: 'MyCart' } as any);
    }
  };

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const bottomInset = Math.max(insets.bottom + 88, 110);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomInset }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>
                User, Example
              </Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, color: colors.dark }}>
                example@gmail.com
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <IconBadge icon={<Ionicons name="notifications-outline" size={20} color={colors.dark} />} count={unreadCount > 0 ? unreadCount : undefined} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('MyFavourites')}>
                <IconBadge icon={<Ionicons name="star-outline" size={20} color={colors.dark} />} count={favouritesCount} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openCart}>
                <IconBadge icon={<Ionicons name="cart-outline" size={20} color={colors.dark} />} count={cartCount} />
              </TouchableOpacity>
            </View>
          </View>

          {processingOrder ? (
            <View
              style={{
                marginTop: 8,
                alignSelf: 'flex-end',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.dark,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.yellow }}>
                • Processing order
              </Text>
            </View>
          ) : null}

          <View
            style={{
              marginTop: 14,
              backgroundColor: colors.yellow,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.bold, fontSize: 18, color: colors.dark }}>
                Fast Hardware Delivery
              </Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                Tools, parts & equipments
              </Text>
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: colors.dark,
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Order Now</Text>
              </View>
            </View>
            <View
              style={{
                width: 86,
                height: 86,
                borderRadius: 16,
                backgroundColor: '#F4C84E',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="construct" size={36} color={colors.dark} />
            </View>
          </View>

          <View
            style={{
              marginTop: 16,
              flexDirection: 'row',
              backgroundColor: '#FFE28A',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Orders', icon: 'cube-outline', route: 'MyOrders' },
              { label: 'Favourites', icon: 'star-outline', route: 'MyFavourites' },
              { label: 'Address', icon: 'location-outline', route: 'Address' },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.route as any)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRightWidth: index < 2 ? 1 : 0,
                  borderRightColor: colors.white,
                }}
              >
                <Ionicons name={item.icon as any} size={18} color={colors.dark} />
                <Text style={{ marginTop: 6, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Settings</Text>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(true)}
              style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="language" size={18} color={colors.dark} />
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>{language}</Text>
              </View>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>More</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Additional</Text>
            <View style={{ marginTop: 12, gap: 12 }}>
              {[
                { label: 'Allow Notifications', value: allowNotifications, setter: setAllowNotifications, key: 'pref-notifications' },
                { label: 'Allow Emails', value: allowEmails, setter: setAllowEmails, key: 'pref-emails' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => {
                    const next = !item.value;
                    item.setter(next as any);
                    persistPrefs(item.key, String(next));
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderWidth: 2,
                      borderColor: colors.dark,
                      backgroundColor: item.value ? colors.dark : colors.white,
                    }}
                  />
                  <Text style={{ fontFamily: typography.fonts.regular, fontSize: 14, color: colors.dark }}>
                    {item.label}
                  </Text>
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

          <Text
            style={{
              marginTop: 16,
              textAlign: 'center',
              fontFamily: typography.fonts.regular,
              fontSize: 12,
              color: colors.gray500,
            }}
          >
            v.1.234
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showLanguageModal} transparent animationType="fade">
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
                  persistPrefs('pref-language', item);
                  setShowLanguageModal(false);
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

