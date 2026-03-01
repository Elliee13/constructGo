import React, { useState } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, View } from 'react-native';
import AppButton from './AppButton';
import AppInput from './AppInput';
import { layout } from '../theme/layout';
import { colors, typography } from '../theme/theme';
import { useToastStore } from '../stores/toastStore';
import { signInWithSupabaseEmail } from '../stores/supabaseAuthStore';
import { useProfileStore } from '../stores/profileStore';
import { useAppRoleStore, type AppRole } from '../stores/appRoleStore';
import { useAuthStore } from '../stores/authStore';
import { useDriverAuthStore } from '../stores/driverAuthStore';
import { useStoreOwnerAuthStore } from '../stores/storeOwnerAuthStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';

type EmailPasswordAuthScreenProps = {
  expectedRole: AppRole;
  title: string;
  subtitle: string;
  defaultEmail?: string;
  defaultPassword?: string;
};

const EmailPasswordAuthScreen = ({
  expectedRole,
  title,
  subtitle,
  defaultEmail = '',
  defaultPassword = '',
}: EmailPasswordAuthScreenProps) => {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [loading, setLoading] = useState(false);

  const showToast = useToastStore((s) => s.showToast);
  const setRole = useAppRoleStore((s) => s.setRole);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const markLegacyStore = (role: AppRole, nextEmail: string) => {
    if (role === 'customer') {
      useAuthStore.setState({ loggedIn: true, email: nextEmail });
      return;
    }

    if (role === 'driver') {
      useDriverAuthStore.setState({ loggedIn: true });
      return;
    }

    if (role === 'store_owner') {
      useStoreOwnerAuthStore.getState().signIn(nextEmail, '');
      return;
    }

    useAdminAuthStore.getState().signIn(nextEmail, '');
  };

  const handleSignIn = async () => {
    if (loading) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) return;

    setLoading(true);
    try {
      await signInWithSupabaseEmail(normalizedEmail, password);
      const resolvedRole = await useProfileStore.getState().loadProfileForSession();

      if (!resolvedRole) {
        throw new Error('No profile role found for this account.');
      }

      markLegacyStore(resolvedRole, normalizedEmail);
      setRole(resolvedRole);

      if (resolvedRole !== expectedRole) {
        showToast({
          type: 'warning',
          title: 'Role mismatch',
          message: `This account is ${resolvedRole.replace('_', ' ')}. Redirecting.`,
        });
        return;
      }

      showToast({
        type: 'success',
        title: 'Signed in',
        message: `Authenticated as ${resolvedRole.replace('_', ' ')}.`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Sign in failed',
        message: error instanceof Error ? error.message : 'Unable to authenticate.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { flex: 1, paddingTop: 24 }]}> 
        <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.dark }}>{title}</Text>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>
          {subtitle}
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
            onPress={handleSignIn}
            showArrow
            loading={loading}
            disabled={!email.trim() || !password.trim()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EmailPasswordAuthScreen;

