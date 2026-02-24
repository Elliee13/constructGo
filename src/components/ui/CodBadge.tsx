import React from 'react';
import { Text, View } from 'react-native';
import { radii, typography } from '../../theme/theme';

type CodBadgeProps = {
  label?: string;
};

const CodBadge = ({ label = 'COD' }: CodBadgeProps) => {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.sm,
        backgroundColor: '#FFF2C6',
      }}
    >
      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 10, color: '#B37B00' }}>{label}</Text>
    </View>
  );
};

export default CodBadge;
