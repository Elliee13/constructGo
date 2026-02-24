import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../../theme/theme';

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

const SectionTitle = ({ title, actionLabel, onActionPress }: SectionTitleProps) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: typography.fonts.semibold, fontSize: typography.sizes.lg, color: colors.dark }}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={{ fontFamily: typography.fonts.medium, fontSize: typography.sizes.sm, color: colors.gray600 }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default SectionTitle;
