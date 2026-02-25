import React, { useMemo, useState } from 'react';
import { Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, typography } from '../theme/theme';
import { useSupabaseAuthStore } from '../stores/supabaseAuthStore';
import { useProfileStore } from '../stores/profileStore';
import { useAppRoleStore } from '../stores/appRoleStore';
import { useAuthStore } from '../stores/authStore';
import { useDriverAuthStore } from '../stores/driverAuthStore';
import { useStoreOwnerAuthStore } from '../stores/storeOwnerAuthStore';
import { useAdminAuthStore } from '../stores/adminAuthStore';

const shorten = (value: string | null | undefined, head = 8, tail = 4) => {
  if (!value) return '-';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

const DevSessionBadge = () => {
  const [expanded, setExpanded] = useState(false);

  const supabaseReady = useSupabaseAuthStore((s) => s.isReady);
  const supabaseAuthed = useSupabaseAuthStore((s) => s.isAuthenticated);
  const supabaseUserId = useSupabaseAuthStore((s) => s.userId);
  const supabaseEmail = useSupabaseAuthStore((s) => s.userEmail);
  const accessToken = useSupabaseAuthStore((s) => s.accessToken);
  const expiresAt = useSupabaseAuthStore((s) => s.expiresAt);

  const profileRole = useProfileStore((s) => s.role);
  const appRole = useAppRoleStore((s) => s.appRole);

  const customerLoggedIn = useAuthStore((s) => s.loggedIn);
  const driverLoggedIn = useDriverAuthStore((s) => s.loggedIn);
  const storeOwnerLoggedIn = useStoreOwnerAuthStore((s) => s.loggedIn);
  const adminLoggedIn = useAdminAuthStore((s) => s.loggedIn);

  const fallbackMode = useMemo(() => {
    if (supabaseAuthed) return false;
    return customerLoggedIn || driverLoggedIn || storeOwnerLoggedIn || adminLoggedIn;
  }, [supabaseAuthed, customerLoggedIn, driverLoggedIn, storeOwnerLoggedIn, adminLoggedIn]);

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: topInset + 8,
        right: 10,
        zIndex: 999,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded((prev) => !prev)}
        style={{
          alignSelf: 'flex-end',
          backgroundColor: colors.dark,
          borderRadius: radii.md,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }}
      >
        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.white }}>
          DEV {supabaseAuthed ? 'Supabase' : fallbackMode ? 'Fallback' : 'Guest'}
        </Text>
      </TouchableOpacity>

      {expanded ? (
        <View
          style={{
            marginTop: 8,
            minWidth: 240,
            backgroundColor: colors.white,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.gray300,
            padding: 10,
          }}
        >
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 12, color: colors.dark }}>Session Debug</Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            Supabase ready: {String(supabaseReady)}
          </Text>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            Supabase auth: {String(supabaseAuthed)}
          </Text>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            Fallback mode: {String(fallbackMode)}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            appRole: {appRole ?? '-'}
          </Text>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            profileRole: {profileRole ?? '-'}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            userId: {shorten(supabaseUserId, 10, 4)}
          </Text>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            email: {supabaseEmail ?? '-'}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            token: {shorten(accessToken, 12, 6)}
          </Text>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.dark }}>
            expiresAt: {expiresAt ?? '-'}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default DevSessionBadge;
