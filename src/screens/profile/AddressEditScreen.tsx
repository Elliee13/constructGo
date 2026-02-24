import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import MapPlaceholder from '../../components/MapPlaceholder';
import { useToastStore } from '../../stores/toastStore';
import useHideTabs from '../../navigation/useHideTabs';

const ADDRESS_KEY = 'address-info';

const AddressEditScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const [businessName, setBusinessName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [additional, setAdditional] = useState('');
  const showToast = useToastStore((s) => s.showToast);

  const handleSave = async () => {
    const payload = { businessName, houseNumber, street, additional };
    await AsyncStorage.setItem(ADDRESS_KEY, JSON.stringify(payload));
    showToast({ type: 'success', title: 'Address saved', message: 'Your address has been updated.' });
    navigation.goBack();
  };

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={20} color={colors.dark} />
          </TouchableOpacity>
          <MapPlaceholder height={200} />

          <Text style={{ marginTop: 14, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
            Address Information
          </Text>

          <View style={{ marginTop: 14, gap: 12 }}>
            <AppInput placeholder="Business or building name" value={businessName} onChangeText={setBusinessName} />
            <AppInput placeholder="Plot or House Number" value={houseNumber} onChangeText={setHouseNumber} />
            <AppInput placeholder="Street Address" value={street} onChangeText={setStreet} />
            <AppInput
              placeholder="Additional..."
              value={additional}
              onChangeText={setAdditional}
              multiline
              style={{ height: 90, textAlignVertical: 'top' }}
            />
          </View>

          <View style={{ marginTop: 20 }}>
            <AppButton title="Save" onPress={handleSave} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddressEditScreen;
