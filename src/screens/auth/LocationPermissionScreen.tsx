import React from 'react';
import { Text, View } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

const LocationPermissionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <AppScreen scroll>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 8 }]}> 
            <AppHeader title="Allow location access" />
            <View
              style={{
                marginTop: 16,
                width: '100%',
                height: 220,
                borderRadius: 20,
                backgroundColor: colors.gray200,
              }}
            />
            <Text
              style={{
                marginTop: 6,
                fontFamily: typography.fonts.regular,
                fontSize: typography.sizes.sm,
                color: colors.gray600,
              }}
            >
              Enable location services to see hardware stores near Tagum City.
            </Text>
          </View>

          <View style={[layout.container, { gap: 12, marginBottom: 8 }]}> 
            <AppButton title="Allow" onPress={() => navigation.navigate('PaymentMethod')} />
            <AppButton title="Close" variant="secondary" onPress={() => navigation.navigate('PaymentMethod')} />
          </View>
        </View>
    </AppScreen>
  );
};

export default LocationPermissionScreen;
