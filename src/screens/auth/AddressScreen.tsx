import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';

const AddressScreen = () => {
  const login = useAuthStore((s) => s.login);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const [businessName, setBusinessName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [additional, setAdditional] = useState('');

  const handleContinue = () => {
    completeOnboarding();
    login();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 8 }]}> 
            <View
              style={{
                width: '100%',
                height: 200,
                borderRadius: 20,
                backgroundColor: colors.gray200,
              }}
            />

            <Text
              style={{
                marginTop: 20,
                fontFamily: typography.fonts.semibold,
                fontSize: 24,
                color: colors.dark,
              }}
            >
              Address Information
            </Text>

            <View style={{ marginTop: 16, gap: 12 }}>
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
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton title="Save and Continue" onPress={handleContinue} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddressScreen;
