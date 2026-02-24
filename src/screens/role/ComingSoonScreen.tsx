import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useAppRoleStore } from '../../stores/appRoleStore';

const ComingSoonScreen = () => {
  const role = useAppRoleStore((s) => s.appRole);
  const setRole = useAppRoleStore((s) => s.setRole);
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { flex: 1, justifyContent: 'center' }]}> 
        <Text style={{ fontFamily: typography.fonts.bold, fontSize: 26, color: colors.dark }}>
          Coming Soon
        </Text>
        <Text style={{ marginTop: 10, fontFamily: typography.fonts.regular, fontSize: 14, color: colors.gray600 }}>
          {role === 'store_owner' ? 'Store Owner mode' : 'Admin mode'} is not available yet.
        </Text>

        <TouchableOpacity
          onPress={() => setRole(null)}
          style={{
            marginTop: 20,
            height: 58,
            borderRadius: 58,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Back to Role Selection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ComingSoonScreen;


