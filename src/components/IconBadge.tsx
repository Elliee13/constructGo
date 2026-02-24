import React from 'react';
import { Text, View } from 'react-native';
import { colors, typography } from '../theme/theme';

interface IconBadgeProps {
  icon: React.ReactNode;
  count?: number;
}

const IconBadge: React.FC<IconBadgeProps> = ({ icon, count }) => {
  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
      {typeof count === 'number' ? (
        <View
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.yellow,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fonts.bold,
              fontSize: 10,
              color: colors.dark,
            }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default IconBadge;
