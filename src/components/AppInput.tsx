import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { colors, radii, typography } from '../theme/theme';

const AppInput: React.FC<TextInputProps> = (props) => {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radii.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: colors.white,
      }}
    >
      <TextInput
        placeholderTextColor={colors.gray500}
        {...props}
        style={[
          {
            fontFamily: typography.fonts.regular,
            fontSize: typography.sizes.md,
            color: colors.dark,
          },
          props.style,
        ]}
      />
    </View>
  );
};

export default AppInput;
