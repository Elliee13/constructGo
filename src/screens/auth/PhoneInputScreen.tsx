import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../stores/authStore';

const PhoneInputScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const setPhone = useAuthStore((s) => s.setPhone);

  return (
    <AppScreen scroll>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 8 }]}> 
            <AppHeader title="Enter your mobile number" onBack={() => navigation.goBack()} />

            <View style={{ marginTop: 20, flexDirection: 'row', gap: 10 }}>
              <View
                style={{
                  width: 72,
                  height: 52,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.gray300,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fonts.medium,
                    fontSize: typography.sizes.md,
                    color: colors.dark,
                  }}
                >
                  +63
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <AppInput keyboardType="phone-pad" placeholder="Mobile number" onChangeText={setPhone} />
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 24,
                gap: 12,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.gray200 }} />
              <Text
                style={{
                  fontFamily: typography.fonts.medium,
                  fontSize: typography.sizes.sm,
                  color: colors.gray500,
                }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.gray200 }} />
            </View>

            <TouchableOpacity
              style={{
                marginTop: 18,
                height: 52,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.gray300,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fonts.medium,
                  fontSize: typography.sizes.md,
                  color: colors.dark,
                }}
              >
                Continue with Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('SupabaseCustomerSignIn')}
              style={{
                marginTop: 10,
                height: 52,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.dark,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fonts.medium,
                  fontSize: typography.sizes.md,
                  color: colors.dark,
                }}
              >
                Continue with Email (Supabase)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton title="Continue" showArrow onPress={() => navigation.navigate('Otp')} />
          </View>
        </View>
    </AppScreen>
  );
};

export default PhoneInputScreen;
