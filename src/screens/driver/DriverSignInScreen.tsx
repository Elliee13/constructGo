import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useDriverAuthStore } from '../../stores/driverAuthStore';

const DriverSignInScreen = () => {
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('Miguel');
  const [lastName, setLastName] = useState('Santos');
  const setStorePhone = useDriverAuthStore((s) => s.setPhone);
  const setName = useDriverAuthStore((s) => s.setName);
  const login = useDriverAuthStore((s) => s.login);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 16, flex: 1 }]}> 
        <View style={{ width: 52, height: 36, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="car-sport-outline" size={18} color={colors.white} />
        </View>

        <Text style={{ marginTop: 18, fontFamily: typography.fonts.bold, fontSize: 24, color: colors.dark }}>
          Driver Sign In
        </Text>
        <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 13, color: colors.gray600 }}>
          Continue as a delivery partner.
        </Text>

        <View style={{ marginTop: 18, gap: 12 }}>
          <AppInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppInput value={firstName} onChangeText={setFirstName} placeholder="First name" />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput value={lastName} onChangeText={setLastName} placeholder="Last name" />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 'auto', marginBottom: 24 }}>
          <AppButton
            title="Continue"
            showArrow
            onPress={() => {
              setStorePhone(phone.trim());
              setName(firstName.trim() || 'Miguel', lastName.trim() || 'Santos');
              login();
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DriverSignInScreen;


