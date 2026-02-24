import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  showArrow?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  style?: ViewStyle;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  showArrow = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  const backgroundColor = isPrimary
    ? colors.dark
    : isSecondary
      ? colors.gray100
      : isDanger
        ? colors.error
        : 'transparent';
  const textColor = isPrimary || isDanger ? colors.white : colors.dark;
  const borderWidth = isGhost ? 1 : 0;
  const borderColor = isGhost ? colors.gray300 : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        {
          height: 58,
          width: '100%',
          borderRadius: radii.pill,
          backgroundColor,
          borderWidth,
          borderColor,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={textColor} /> : null}
      {!loading && leftIcon ? <Ionicons name={leftIcon} size={18} color={textColor} /> : null}
      <Text
        style={{
          color: textColor,
          fontFamily: typography.fonts.semibold,
          fontSize: typography.sizes.md,
        }}
      >
        {title}
      </Text>
      {showArrow ? (
        <Ionicons
          name="arrow-forward"
          size={18}
          color={textColor}
        />
      ) : null}
      {!showArrow && rightIcon ? <Ionicons name={rightIcon} size={18} color={textColor} /> : null}
    </TouchableOpacity>
  );
};

export default AppButton;
