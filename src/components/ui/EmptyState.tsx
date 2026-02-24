import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import AppButton from '../AppButton';
import { colors, spacing, typography } from '../../theme/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onActionPress?: () => void;
};

const EmptyState = ({
  icon = 'cube-outline',
  title,
  subtitle,
  actionTitle,
  onActionPress,
}: EmptyStateProps) => {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      <Ionicons name={icon} size={30} color={colors.gray500} />
      <Text style={{ marginTop: spacing.sm, fontFamily: typography.fonts.medium, color: colors.dark }}>{title}</Text>
      {subtitle ? (
        <Text
          style={{
            marginTop: spacing.xs,
            textAlign: 'center',
            fontFamily: typography.fonts.regular,
            fontSize: typography.sizes.sm,
            color: colors.gray600,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {actionTitle && onActionPress ? (
        <View style={{ marginTop: spacing.md, width: '100%' }}>
          <AppButton title={actionTitle} onPress={onActionPress} />
        </View>
      ) : null}
    </View>
  );
};

export default EmptyState;
