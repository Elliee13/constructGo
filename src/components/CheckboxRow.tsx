import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme/theme';

interface CheckboxRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

const CheckboxRow: React.FC<CheckboxRowProps> = ({ label, checked, onToggle }) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: checked ? colors.dark : colors.gray400,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? colors.dark : colors.white,
        }}
      >
        {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
      </View>
      <Text
        style={{
          fontFamily: typography.fonts.medium,
          fontSize: typography.sizes.md,
          color: colors.dark,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default CheckboxRow;
