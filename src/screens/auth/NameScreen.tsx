import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../stores/authStore';

const NameScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const setName = useAuthStore((s) => s.setName);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleContinue = () => {
    setName(firstName, lastName);
    navigation.navigate('Terms');
  };

  return (
    <AppScreen scroll>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 8 }]}> 
            <AppHeader title="What's your name?" />
            <Text
              style={{
                marginTop: 6,
                fontFamily: typography.fonts.regular,
                fontSize: typography.sizes.sm,
                color: colors.gray600,
              }}
            >
              Tell us how to address you.
            </Text>

            <View style={{ marginTop: 20, gap: 12 }}>
              <AppInput placeholder="First name" value={firstName} onChangeText={setFirstName} />
              <AppInput placeholder="Last name" value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton title="Continue" onPress={handleContinue} />
          </View>
        </View>
    </AppScreen>
  );
};

export default NameScreen;
