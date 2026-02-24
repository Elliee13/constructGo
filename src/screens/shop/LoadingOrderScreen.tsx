import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { colors, typography } from '../../theme/theme';
import { useOrderStore } from '../../stores/orderStore';
import useHideTabs from '../../navigation/useHideTabs';

const LoadingOrderScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;
  const [seconds, setSeconds] = useState(5);
  const handledRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const finishAndGo = () => {
    if (handledRef.current) return;
    handledRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    navigation.reset({ index: 0, routes: [{ name: 'ShopHome' }] });
    const parent = navigation.getParent();
    parent?.navigate('Profile', { screen: 'OrderStatus', params: { orderId } } as any);
  };

  useEffect(() => {
    if (seconds <= 0) finishAndGo();
  }, [seconds]);

  const handleCancel = () => {
    if (handledRef.current) return;
    handledRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    cancelOrder(orderId);
    navigation.reset({ index: 0, routes: [{ name: 'ShopHome' }] });
    const parent = navigation.getParent();
    parent?.navigate('Profile', { screen: 'OrderResult', params: { orderId, status: 'Cancelled' } } as any);
  };

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingTop: topInset }}>
      <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Placing your order...</Text>
      <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>{seconds}s</Text>
      <TouchableOpacity
        onPress={handleCancel}
        style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.dark }}
      >
        <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Cancel Order</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoadingOrderScreen;
