import React, { useState } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { signInWithSupabaseEmail, signUpWithSupabaseEmail } from '../../stores/supabaseAuthStore';
import { useProfileStore } from '../../stores/profileStore';
import { useToastStore } from '../../stores/toastStore';

const SupabaseCustomerSignInScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [loading, setLoading] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const handleSubmit = async () => {
    if (loading) return;
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (mode === 'sign_in') {
        await signInWithSupabaseEmail(email.trim(), password);
      } else {
        await signUpWithSupabaseEmail(email.trim(), password);
      }

      await useProfileStore.getState().ensureProfileForRole('customer');

      showToast({
        type: 'success',
        title: mode === 'sign_in' ? 'Signed in' : 'Account created',
        message: 'Supabase session active for customer role.',
      });
      navigation.goBack();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unable to sign in with Supabase.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { flex: 1, paddingTop: 24 }]}> 
        <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.dark }}>
          Customer Supabase Auth
        </Text>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>
          Email/password login for incremental migration.
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

        <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Sign In"
              variant={mode === 'sign_in' ? 'primary' : 'secondary'}
              onPress={() => setMode('sign_in')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Sign Up"
              variant={mode === 'sign_up' ? 'primary' : 'secondary'}
              onPress={() => setMode('sign_up')}
            />
          </View>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: 24 }}>
          <AppButton
            title={mode === 'sign_in' ? 'Continue with Supabase' : 'Create account with Supabase'}
            onPress={handleSubmit}
            showArrow
            loading={loading}
            disabled={!email.trim() || !password.trim()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SupabaseCustomerSignInScreen;
