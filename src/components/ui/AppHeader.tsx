import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme/theme';

type AppHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  variant?: 'light' | 'dark';
};

const AppHeader = ({ title, onBack, right, variant = 'light' }: AppHeaderProps) => {
  const isDark = variant === 'dark';
  const backBg = isDark ? colors.white : colors.dark;
  const backIcon = isDark ? colors.dark : colors.white;
  const titleColor = isDark ? colors.white : colors.dark;

  return (
    <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ width: 96 }}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 42,
              height: 34,
              borderRadius: radii.sm,
              backgroundColor: backBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={18} color={backIcon} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={{ flex: 1, textAlign: 'center', fontFamily: typography.fonts.semibold, fontSize: typography.sizes.subtitle, color: titleColor }}>
        {title}
      </Text>

      <View style={{ width: 96, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
};

export default AppHeader;
