import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import MapPlaceholder from '../../components/MapPlaceholder';

const ADDRESS_KEY = 'address-info';

type AddressInfo = {
  businessName: string;
  houseNumber: string;
  street: string;
  additional: string;
};

const AddressScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'Current' | 'Saved'>('Current');
  const [address, setAddress] = useState<AddressInfo | null>(null);

  const loadAddress = useCallback(async () => {
    const raw = await AsyncStorage.getItem(ADDRESS_KEY);
    if (raw) setAddress(JSON.parse(raw));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddress();
    }, [loadAddress])
  );

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const bottomInset = Math.max(insets.bottom + 88, 110);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomInset }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={20} color={colors.dark} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Address</Text>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 12 }}>
            {['Current', 'Saved'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item as 'Current' | 'Saved')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: tab === item ? colors.dark : colors.gray100,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: tab === item ? colors.white : colors.dark }}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'Current' ? (
            <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>Current Address</Text>
              <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                {address
                  ? `${address.businessName}, ${address.houseNumber} ${address.street}`
                  : 'No address saved yet.'}
              </Text>
              <TouchableOpacity style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>View</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              <MapPlaceholder height={200} />
              <View style={{ marginTop: 12, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 14 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>Address Information</Text>
                <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  {address?.businessName || 'Business or building name'}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  {address?.houseNumber || 'Plot or House Number'}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  {address?.street || 'Street Address'}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  {address?.additional || 'Additional'}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddressEdit')} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('AddressEdit')}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.gray300,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>
              Add new address
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddressScreen;
