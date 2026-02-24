import React from 'react';
import { Text, View } from 'react-native';
import { colors, radii, typography } from '../theme/theme';

interface Tile {
  label: string;
  icon?: React.ReactNode;
}

interface QuickActionTilesProps {
  tiles: Tile[];
}

const QuickActionTiles: React.FC<QuickActionTilesProps> = ({ tiles }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: radii.lg,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray200,
        overflow: 'hidden',
      }}
    >
      {tiles.map((tile, index) => (
        <View
          key={tile.label}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 18,
            borderRightWidth: index < tiles.length - 1 ? 1 : 0,
            borderRightColor: colors.gray200,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.yellow,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            {tile.icon}
          </View>
          <Text
            style={{
              fontFamily: typography.fonts.medium,
              fontSize: typography.sizes.sm,
              color: colors.dark,
            }}
          >
            {tile.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default QuickActionTiles;
