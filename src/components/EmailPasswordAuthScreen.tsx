import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import AppButton from './AppButton';
import AppInput from './AppInput';
import { layout } from '../theme/layout';
import { colors, radii, typography } from '../theme/theme';
import { useToastStore } from '../stores/toastStore';
import { useProfileStore } from '../stores/profileStore';
import { useAppRoleStore, type AppRole } from '../stores/appRoleStore';
import { supabase } from '../lib/supabase';
import { useSupabaseAuthStore } from '../stores/supabaseAuthStore';

type EmailPasswordAuthScreenProps = {
  title: string;
  subtitle: string;
};

const roleToEmail: Record<AppRole, string> = {
  driver: 'driver_demo@email.com',
  customer: 'customer_demo@email.com',
  store_owner: 'store_demo@email.com',
  admin: 'admin_demo@email.com',
};

const roleLabels: Record<AppRole, string> = {
  customer: 'Customer',
  driver: 'Driver',
  store_owner: 'Store Owner',
  admin: 'Admin',
};

const roleOptions: AppRole[] = ['customer', 'driver', 'store_owner', 'admin'];

const EmailPasswordAuthScreen = ({ title, subtitle }: EmailPasswordAuthScreenProps) => {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const showToast = useToastStore((s) => s.showToast);
  const setRole = useAppRoleStore((s) => s.setRole);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const selectedEmail = useMemo(() => {
    if (!selectedRole) return null;
    return roleToEmail[selectedRole];
  }, [selectedRole]);

  const handleSignIn = async () => {
    if (loading || !selectedRole) return;
    const email = roleToEmail[selectedRole];
    if (!password.trim()) return;

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.access_token || !sessionData.session.user?.id) {
        throw new Error('Missing Supabase session after sign-in.');
      }

      useSupabaseAuthStore.getState().setSession(sessionData.session);

      const profileRole = await useProfileStore.getState().loadProfileForSession();
      if (!profileRole) {
        throw new Error('No profile role found for this account.');
      }

      setRole(profileRole);

      if (profileRole !== selectedRole) {
        showToast({
          type: 'warning',
          title: 'Role from DB applied',
          message: `Selected ${roleLabels[selectedRole]}, but account role is ${roleLabels[profileRole]}.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Signed in',
          message: `Authenticated as ${roleLabels[profileRole]}.`,
        });
      }
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

        <Text style={{ marginTop: 20, fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>
          Select role
        </Text>
        <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {roleOptions.map((role) => {
            const active = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                onPress={() => setSelectedRole(role)}
                style={{
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: active ? colors.dark : colors.gray300,
                  backgroundColor: active ? colors.dark : colors.white,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.medium,
                    fontSize: 12,
                    color: active ? colors.white : colors.dark,
                  }}
                >
                  {roleLabels[role]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
            Email: {selectedEmail ?? '-'}
          </Text>
        </View>

        <View style={{ marginTop: 12, gap: 12 }}>
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
            disabled={!selectedRole || !password.trim()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EmailPasswordAuthScreen;