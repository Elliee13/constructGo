import React, { useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useStoreOwnerProfileStore } from '../../stores/storeOwnerProfileStore';
import { useAppRoleStore } from '../../stores/appRoleStore';

const StoreOwnerAccountScreen = () => {
  const storeName = useStoreOwnerProfileStore((s) => s.storeName);
  const storeAddress = useStoreOwnerProfileStore((s) => s.storeAddress);
  const notifEnabled = useStoreOwnerProfileStore((s) => s.notifEnabled);
  const setStoreName = useStoreOwnerProfileStore((s) => s.setStoreName);
  const setStoreAddress = useStoreOwnerProfileStore((s) => s.setStoreAddress);
  const setNotifEnabled = useStoreOwnerProfileStore((s) => s.setNotifEnabled);
  const switchRole = useAppRoleStore((s) => s.switchRole);
  const signOutAll = useAppRoleStore((s) => s.signOutAll);

  const [localName, setLocalName] = useState(storeName);
  const [localAddress, setLocalAddress] = useState(storeAddress);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}> 
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Store Account</Text>

          <View style={{ marginTop: 14, gap: 12 }}>
            <AppInput value={localName} onChangeText={setLocalName} placeholder="Store name" />
            <AppInput value={localAddress} onChangeText={setLocalAddress} placeholder="Store address" />

            <TouchableOpacity
              onPress={() => {
                setStoreName(localName.trim() || storeName);
                setStoreAddress(localAddress.trim() || storeAddress);
              }}
              style={{ alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.white }}>Save Info</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              thumbColor={colors.white}
              trackColor={{ false: colors.gray300, true: colors.dark }}
            />
          </View>

          <View style={{ marginTop: 24 }}>
            <AppButton title="Switch Role" onPress={switchRole} />
            <TouchableOpacity onPress={signOutAll} style={{ marginTop: 10, alignSelf: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.gray600 }}>
                Sign out completely
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreOwnerAccountScreen;
