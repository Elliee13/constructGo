import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme/theme';

type AppCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const AppCard = ({ children, style }: AppCardProps) => {
  return (
    <View
      style={[
        {
          padding: spacing.lg,
          borderRadius: radii.lg,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.gray200,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default AppCard;
