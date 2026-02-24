import React, { useState } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useAdminAuthStore } from '../../stores/adminAuthStore';

const AdminSignInScreen = () => {
  const signIn = useAdminAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('admin@constructgo.app');
  const [password, setPassword] = useState('password123');

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { flex: 1, paddingTop: 24 }]}>
        <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.dark }}>
          Admin Sign In
        </Text>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>
          View operations and apply safe controls.
        </Text>

        <View style={{ marginTop: 20, gap: 12 }}>
          <AppInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AppInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
        </View>

        <View style={{ marginTop: 'auto', marginBottom: 24 }}>
          <AppButton
            title="Sign In"
            onPress={() => signIn(email, password)}
            showArrow
            disabled={!email.trim() || !password.trim()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AdminSignInScreen;

