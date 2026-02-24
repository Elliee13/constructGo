import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverAccountStackParamList } from '../../navigation/DriverAccountStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useToastStore } from '../../stores/toastStore';

const DriverSettingsScreen = () => {
  useHideTabs('DriverTabs');
  const navigation = useNavigation<NativeStackNavigationProp<DriverAccountStackParamList>>();
  const showToast = useToastStore((s) => s.showToast);
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const items = [
    { id: 'verify', label: 'Driver Verification', icon: 'shield-checkmark-outline' },
    { id: 'support', label: 'Call Support', icon: 'call-outline' },
    { id: 'help', label: 'Help Center', icon: 'help-circle-outline' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 12 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </TouchableOpacity>
        <Text style={{ marginTop: 10, fontFamily: typography.fonts.semibold, fontSize: 22, color: colors.dark }}>Settings</Text>

        <View style={{ marginTop: 14, gap: 12 }}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => showToast({ type: 'info', title: item.label, message: 'Coming soon' })}
              style={{ borderRadius: radii.lg, borderWidth: 1, borderColor: colors.gray200, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={item.icon as any} size={18} color={colors.dark} />
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DriverSettingsScreen;


