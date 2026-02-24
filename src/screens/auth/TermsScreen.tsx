import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import CheckboxRow from '../../components/CheckboxRow';
import AppScreen from '../../components/ui/AppScreen';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

const TermsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [accepted, setAccepted] = useState(false);

  return (
    <AppScreen scroll>
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
                fontSize: 22,
                color: colors.dark,
              }}
            >
              Accept Hardware's Terms & Review Privacy Notice
            </Text>

            <View style={{ marginTop: 20 }}>
              <CheckboxRow
                label="I agree"
                checked={accepted}
                onToggle={() => setAccepted((prev) => !prev)}
              />
            </View>
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton
              title="Continue"
              disabled={!accepted}
              onPress={() => navigation.navigate('LocationPermission')}
            />
          </View>
        </View>
    </AppScreen>
  );
};

export default TermsScreen;
