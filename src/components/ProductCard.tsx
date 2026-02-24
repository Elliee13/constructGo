import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme/theme';
import type { Product } from '../stores/catalogStore';
import { formatPrice } from '../utils/format';
import CodBadge from './ui/CodBadge';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  onToggleFavourite?: () => void;
  isFavourite?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  onToggleFavourite,
  isFavourite = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: radii.md,
        padding: 10,
      }}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: product.images?.[0] ?? product.image }}
          style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: colors.white }}
        />
        <TouchableOpacity
          onPress={onToggleFavourite}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={14} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddToCart}
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="cart" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 8, fontFamily: typography.fonts.semibold, fontSize: 12, color: colors.dark }}>
        {formatPrice(product.price)}
      </Text>
      <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
        {product.name}
      </Text>
      <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
        {product.soldCountText}
      </Text>

      <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="star" size={12} color={colors.yellow} />
          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.dark }}>
            {product.rating}
          </Text>
        </View>
        {product.codAvailable ? (
          <CodBadge />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;

