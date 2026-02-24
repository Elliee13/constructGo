import React, { useState } from 'react';
import { Text, View, TextInput } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../stores/authStore';

const OtpScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const phone = useAuthStore((s) => s.phone);
  const [code, setCode] = useState(['', '', '', '']);

  const handleChange = (index: number, value: string) => {
    const next = [...code];
    next[index] = value.replace(/\D/g, '').slice(-1);
    setCode(next);
  };

  const isValid = code.join('') === '1234';

  return (
    <AppScreen scroll>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 8 }]}> 
            <AppHeader title="Enter the 4-digit code" />
            <Text
              style={{
                marginTop: 6,
                fontFamily: typography.fonts.regular,
                fontSize: typography.sizes.sm,
                color: colors.gray600,
              }}
            >
              {phone ? `Sent to ${phone}` : 'Sent to your mobile number'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              {code.map((value, index) => (
                <View
                  key={`otp-${index}`}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.gray300,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TextInput
                    value={value}
                    onChangeText={(text) => handleChange(index, text)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={{
                      fontFamily: typography.fonts.semibold,
                      fontSize: 20,
                      color: colors.dark,
                      textAlign: 'center',
                    }}
                  />
                </View>
              ))}
            </View>

            <View
              style={{
                marginTop: 20,
                paddingVertical: 12,
                alignItems: 'center',
                borderRadius: radii.md,
                backgroundColor: colors.gray100,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fonts.medium,
                  fontSize: typography.sizes.sm,
                  color: colors.gray500,
                }}
              >
                I haven't received a code
              </Text>
            </View>
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton
              title="Continue"
              showArrow
              disabled={!isValid}
              onPress={() => navigation.navigate('Name')}
            />
          </View>
        </View>
    </AppScreen>
  );
};

export default OtpScreen;
