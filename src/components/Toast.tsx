import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme/theme';
import { useToastStore } from '../stores/toastStore';

const iconByType = {
  success: 'checkmark-circle',
  warning: 'alert-circle',
  info: 'information-circle',
  error: 'close-circle',
} as const;

const accentByType = {
  success: '#2E7D32',
  warning: '#F2C94C',
  info: colors.yellow,
  error: '#E57373',
} as const;

const Toast = () => {
  const toast = useToastStore((s) => s.toast);
  const hideToast = useToastStore((s) => s.hideToast);
  const insets = useSafeAreaInsets();
  const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const topOffset = Math.max(insets.top, androidTopInset) + 8;
  const translateY = useRef(new Animated.Value(-26)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    translateY.setValue(-26);
    opacity.setValue(0);

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -26, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => hideToast());
    }, toast.durationMs);

    return () => clearTimeout(timer);
  }, [toast, hideToast, opacity, translateY]);

  const accent = useMemo(() => (toast ? accentByType[toast.type] : colors.yellow), [toast]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 16, right: 16, top: topOffset, zIndex: 999 }}
    >
      <Animated.View
        pointerEvents="auto"
        style={{
          backgroundColor: colors.dark,
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: accent,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          transform: [{ translateY }],
          opacity,
        }}
      >
        <Ionicons name={iconByType[toast.type]} size={18} color={accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white, fontSize: 13 }}>{toast.title}</Text>
          <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, color: '#E5E5E5', fontSize: 12 }}>{toast.message}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default Toast;


