import React, { useState } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useStoreOwnerAuthStore } from '../../stores/storeOwnerAuthStore';

const StoreOwnerSignInScreen = () => {
  const signIn = useStoreOwnerAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('owner@constructgo.app');
  const [password, setPassword] = useState('password123');

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { flex: 1, paddingTop: 24 }]}> 
        <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.dark }}>
          Store Owner Sign In
        </Text>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>
          Manage incoming orders and product catalog.
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

export default StoreOwnerSignInScreen;
