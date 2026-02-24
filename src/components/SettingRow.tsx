import React from 'react';
import { Text, View } from 'react-native';
import { colors, typography } from '../theme/theme';

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, value }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text
          style={{
            fontFamily: typography.fonts.medium,
            fontSize: typography.sizes.md,
            color: colors.dark,
          }}
        >
          {label}
        </Text>
      </View>
      {value ? (
        <Text
          style={{
            fontFamily: typography.fonts.regular,
            fontSize: typography.sizes.sm,
            color: colors.gray600,
          }}
        >
          {value}
        </Text>
      ) : null}
    </View>
  );
};

export default SettingRow;
