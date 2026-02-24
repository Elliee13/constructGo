import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

const PaymentMethodScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <AppScreen scroll>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 8 }]}> 
            <AppHeader title="Available payment method" />

            <View
              style={{
                marginTop: 18,
                borderWidth: 1,
                borderColor: colors.gray200,
                borderRadius: radii.lg,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.yellow,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="cash" size={20} color={colors.dark} />
              </View>
              <Text
                style={{
                  fontFamily: typography.fonts.medium,
                  fontSize: typography.sizes.md,
                  color: colors.dark,
                }}
              >
                Cash on Delivery
              </Text>
            </View>
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton title="Continue" onPress={() => navigation.navigate('Address')} />
          </View>
        </View>
    </AppScreen>
  );
};

export default PaymentMethodScreen;
