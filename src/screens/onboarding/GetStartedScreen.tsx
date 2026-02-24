import React from 'react';
import { Text, View, SafeAreaView, ScrollView } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import AppButton from '../../components/AppButton';
import { useOnboardingStore } from '../../stores/onboardingStore';

const GetStartedScreen = () => {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 24 }}>
          <View style={[layout.container, { marginTop: 16 }]}> 
            <View
              style={{
                width: '100%',
                height: 360,
                borderRadius: 24,
                backgroundColor: colors.gray200,
              }}
            />
            <Text
              style={{
                marginTop: 24,
                fontFamily: typography.fonts.semibold,
                fontSize: 28,
                color: colors.dark,
              }}
            >
              Get started with
            </Text>
            <Text
              style={{
                fontFamily: typography.fonts.bold,
                fontSize: 32,
                color: colors.yellow,
              }}
            >
              ConstructGo
            </Text>
          </View>

          <View style={[layout.container, { marginBottom: 8 }]}> 
            <AppButton title="Continue" showArrow onPress={completeOnboarding} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GetStartedScreen;
