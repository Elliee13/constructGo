import React from 'react';
import { Text, View } from 'react-native';
import { colors, radii, typography } from '../../theme/theme';

type StatusPillProps = {
  status: string;
  size?: 'sm' | 'md';
};

type PillStyle = {
  backgroundColor: string;
  color: string;
};

const getPillStyle = (status: string): PillStyle => {
  const normalized = status.toLowerCase();

  if (normalized.includes('deliver')) return { backgroundColor: '#DFF2E1', color: '#2E7D32' };
  if (normalized.includes('cancel') || normalized.includes('declin') || normalized.includes('reject')) {
    return { backgroundColor: '#FCE8E8', color: '#B3261E' };
  }
  if (normalized.includes('out for delivery')) return { backgroundColor: '#E9F2FF', color: '#1B5FAE' };
  if (
    normalized.includes('pending') ||
    normalized.includes('process') ||
    normalized.includes('prepar') ||
    normalized.includes('ready') ||
    normalized.includes('driver requested') ||
    normalized.includes('request')
  ) {
    return { backgroundColor: '#FFF2C6', color: '#B37B00' };
  }

  return { backgroundColor: colors.gray100, color: colors.dark };
};

const StatusPill = ({ status, size = 'md' }: StatusPillProps) => {
  const style = getPillStyle(status);
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: isSmall ? radii.sm : radii.md,
        paddingHorizontal: isSmall ? 8 : 10,
        paddingVertical: isSmall ? 3 : 4,
        backgroundColor: style.backgroundColor,
      }}
    >
      <Text
        style={{
          fontFamily: typography.fonts.medium,
          fontSize: isSmall ? 11 : 12,
          color: style.color,
        }}
      >
        {status}
      </Text>
    </View>
  );
};

export default StatusPill;
