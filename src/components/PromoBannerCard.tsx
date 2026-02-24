import React from 'react';
import { Text, View } from 'react-native';
import { colors, radii, typography } from '../theme/theme';
import AppButton from './AppButton';

interface PromoBannerCardProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  onPress?: () => void;
}

const PromoBannerCard: React.FC<PromoBannerCardProps> = ({
  title,
  subtitle,
  ctaLabel,
  onPress,
}) => {
  return (
    <View
      style={{
        backgroundColor: colors.yellow,
        borderRadius: radii.lg,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: typography.fonts.bold,
            fontSize: typography.sizes.lg,
            color: colors.dark,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: typography.fonts.regular,
              fontSize: typography.sizes.sm,
              color: colors.dark,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
        <View style={{ marginTop: 12, width: 130 }}>
          <AppButton title={ctaLabel} onPress={onPress} />
        </View>
      </View>
      <View
        style={{
          width: 90,
          height: 90,
          borderRadius: 16,
          backgroundColor: colors.white,
          opacity: 0.7,
        }}
      />
    </View>
  );
};

export default PromoBannerCard;
