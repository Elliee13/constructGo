import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';

type MapPlaceholderProps = {
  height?: number;
  style?: ViewStyle;
};

const roadStyle: ViewStyle = {
  position: 'absolute',
  backgroundColor: '#D9E3D3',
  borderRadius: 999,
};

const MapPlaceholder = ({ height = 220, style }: MapPlaceholderProps) => {
  return (
    <View
      style={[
        {
          height,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#EEF5EA',
          borderWidth: 1,
          borderColor: '#D9E3D3',
        },
        style,
      ]}
    >
      <View style={[roadStyle, { top: 28, left: -20, right: -10, height: 14, transform: [{ rotate: '-8deg' }] }]} />
      <View style={[roadStyle, { top: 90, left: -24, right: -24, height: 16, transform: [{ rotate: '6deg' }] }]} />
      <View style={[roadStyle, { top: 154, left: -14, right: -14, height: 14, transform: [{ rotate: '-4deg' }] }]} />
      <View style={[roadStyle, { top: -10, bottom: -10, left: 88, width: 14, transform: [{ rotate: '2deg' }] }]} />
      <View style={[roadStyle, { top: -12, bottom: -12, right: 92, width: 16, transform: [{ rotate: '-5deg' }] }]} />

      <View style={{ position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, height: 34, borderRadius: 8, backgroundColor: '#E1ECD9' }} />
        <View style={{ width: 58, height: 34, borderRadius: 8, backgroundColor: '#E1ECD9' }} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.white,
            borderWidth: 2,
            borderColor: colors.yellow,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="location" size={18} color={colors.dark} />
        </View>
      </View>
    </View>
  );
};

export default MapPlaceholder;

