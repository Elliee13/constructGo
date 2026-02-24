import React from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import AppButton from '../../components/AppButton';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useAppRoleStore } from '../../stores/appRoleStore';

const AdminAccountScreen = () => {
  const email = useAdminAuthStore((s) => s.email);
  const adminSignOut = useAdminAuthStore((s) => s.signOut);
  const switchRole = useAppRoleStore((s) => s.switchRole);
  const signOutAll = useAppRoleStore((s) => s.signOutAll);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Admin Account</Text>
          <Text style={{ marginTop: 10, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>
            {email || 'admin@constructgo.app'}
          </Text>

          <View style={{ marginTop: 24 }}>
            <AppButton title="Switch Role" onPress={switchRole} />
            <TouchableOpacity
              onPress={async () => {
                adminSignOut();
                await signOutAll();
              }}
              style={{ marginTop: 10, alignSelf: 'center' }}
            >
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

export default AdminAccountScreen;
