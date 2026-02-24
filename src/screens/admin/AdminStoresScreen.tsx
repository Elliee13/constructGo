import React from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useStoreOwnerProfileStore } from '../../stores/storeOwnerProfileStore';
import { useToastStore } from '../../stores/toastStore';

const AdminStoresScreen = () => {
  const storeId = useStoreOwnerProfileStore((s) => s.storeId);
  const storeName = useStoreOwnerProfileStore((s) => s.storeName);
  const storeAddress = useStoreOwnerProfileStore((s) => s.storeAddress);
  const isActive = useStoreOwnerProfileStore((s) => s.isActive);
  const setIsActive = useStoreOwnerProfileStore((s) => s.setIsActive);
  const showToast = useToastStore((s) => s.showToast);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Admin Stores</Text>

          <View style={{ marginTop: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="storefront-outline" size={20} color={colors.dark} />
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{storeName}</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={(value) => {
                  setIsActive(value);
                  showToast({
                    type: value ? 'success' : 'warning',
                    title: value ? 'Store enabled' : 'Store disabled',
                    message: value
                      ? 'Products are visible to customers again.'
                      : 'Products are hidden and new orders are blocked.',
                  });
                }}
                thumbColor={colors.white}
                trackColor={{ false: colors.gray300, true: colors.dark }}
              />
            </View>

            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Store ID: {storeId}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              {storeAddress}
            </Text>
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, fontSize: 12, color: isActive ? '#2E7D32' : '#B3261E' }}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={{ marginTop: 14, borderRadius: 10, backgroundColor: colors.gray100, padding: 12 }}>
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Safety notes</Text>
            <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              Disabling a store only affects product visibility and new order placement. Existing orders continue unaffected.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminStoresScreen;

