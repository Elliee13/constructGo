import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useAppRoleStore } from '../../stores/appRoleStore';

const options = [
  { id: 'customer', title: 'Customer', subtitle: 'Browse, order, and track hardware delivery', disabled: false },
  { id: 'driver', title: 'Driver', subtitle: 'Accept requests and manage deliveries', disabled: false },
  { id: 'store_owner', title: 'Store Owner', subtitle: 'Manage orders and products', disabled: false },
  { id: 'admin', title: 'Admin', subtitle: 'Audit operations and apply safe controls', disabled: false },
] as const;

const RoleSelectScreen = () => {
  const setRole = useAppRoleStore((s) => s.setRole);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 24 }]}> 
        <Text style={{ fontFamily: typography.fonts.bold, fontSize: 28, color: colors.dark }}>
          ConstructGo
        </Text>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 14, color: colors.gray600 }}>
          Choose how you want to use the app.
        </Text>

        <View style={{ marginTop: 20, gap: 12 }}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              disabled={option.disabled}
              onPress={() => setRole(option.id)}
              style={{
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: option.disabled ? colors.gray300 : colors.dark,
                backgroundColor: option.disabled ? colors.gray100 : colors.white,
                padding: 14,
                opacity: option.disabled ? 0.75 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>
                  {option.title}
                </Text>
                {option.disabled ? (
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.gray500 }}>
                    Soon
                  </Text>
                ) : (
                  <Ionicons name="arrow-forward" size={18} color={colors.dark} />
                )}
              </View>
              <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                {option.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RoleSelectScreen;


