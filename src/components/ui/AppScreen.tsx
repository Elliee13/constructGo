import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { layout } from '../../theme/layout';
import { colors, spacing } from '../../theme/theme';

type AppScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const AppScreen = ({
  children,
  scroll = false,
  padded = false,
  style,
  contentContainerStyle,
}: AppScreenProps) => {
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const wrappedChildren = padded ? <View style={layout.container}>{children}</View> : children;

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ paddingBottom: spacing.xxxl }, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {wrappedChildren}
        </ScrollView>
      ) : (
        wrappedChildren
      )}
    </SafeAreaView>
  );
};

export default AppScreen;
