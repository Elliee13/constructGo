import React, { useMemo } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useCatalogStore } from '../../stores/catalogStore';
import { useFavouritesStore } from '../../stores/favouritesStore';
import { useCartStore } from '../../stores/cartStore';
import ProductCard from '../../components/ProductCard';
import useHideTabs from '../../navigation/useHideTabs';
import { formatPrice } from '../../utils/format';
import CodBadge from '../../components/ui/CodBadge';

const ProductDetailsScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const productId = route.params?.productId ?? 'p1';
  const products = useCatalogStore((s) => s.products);
  const product = products.find((item) => item.id === productId);
  const favourites = useFavouritesStore((s) => s.favourites);
  const toggleFavourite = useFavouritesStore((s) => s.toggleFavourite);
  const favouritesCount = favourites.length;
  const cartCount = useCartStore((s) => s.cartCount);
  const addToCart = useCartStore((s) => s.addToCart);
  const insets = useSafeAreaInsets();

  const recommended = useMemo(() => {
    if (!product) return [];
    return products.filter((item) => product.recommendations.includes(item.id));
  }, [product, products]);
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { paddingTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Product not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isFavourite = favourites.includes(product.id);

  const handleAddToCart = () => {
    if (product.optionGroups && product.optionGroups.length > 0) {
      navigation.navigate('ProductOptions', { productId: product.id });
      return;
    }
    addToCart(product.id, 1);
  };

  const goToProfileRoute = (screen: string) => {
    const parent = navigation.getParent();
    parent?.navigate('Profile', { screen } as any);
  };

  const stickyBottom = Math.max(insets.bottom + 8, 16);
  const stickyHeight = 58;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: stickyBottom + stickyHeight + 24 }}>
        <View style={[layout.container, { paddingTop: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => goToProfileRoute('MyFavourites')} style={{ position: 'relative' }}>
                <Ionicons name="star-outline" size={20} color={colors.dark} />
                {favouritesCount > 0 ? (
                  <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ fontFamily: typography.fonts.bold, fontSize: 10, color: colors.dark }}>{favouritesCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('MyCart')} style={{ position: 'relative' }}>
                <Ionicons name="cart-outline" size={20} color={colors.dark} />
                {cartCount > 0 ? (
                  <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ fontFamily: typography.fonts.bold, fontSize: 10, color: colors.dark }}>{cartCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ gap: 10 }}>
            {product.images.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: 300, height: 220, borderRadius: 16, backgroundColor: colors.white }} />
            ))}
          </ScrollView>

          <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark, flex: 1 }}>
              {product.name}
            </Text>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>
              {formatPrice(product.price)}
            </Text>
          </View>

          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
            Model: {product.model} | SKU: {product.sku}
          </Text>

          <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{product.description}</Text>

          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{product.soldCountText}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#FFF2C6' }}>
              <Ionicons name="star" size={12} color={colors.yellow} />
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.dark }}>{product.rating}</Text>
            </View>
            {product.codAvailable ? (
              <CodBadge />
            ) : null}
          </View>

          <View style={{ marginTop: 14, height: 1, backgroundColor: colors.gray200 }} />

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Product Details</Text>
            <Text style={{ marginTop: 10, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Key Features</Text>
            <View style={{ marginTop: 6, gap: 6 }}>
              {product.keyFeatures.map((item) => (
                <View key={item} style={{ flexDirection: 'row', gap: 6 }}>
                  <Text style={{ fontFamily: typography.fonts.bold, color: colors.dark }}>•</Text>
                  <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 10, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>What's Included</Text>
            <Text numberOfLines={2} style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
              {product.whatsIncluded}
            </Text>
          </View>

          <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: colors.gray100 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Specs</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' }}>
              {product.specs.map((spec) => (
                <View key={`${product.id}-${spec.label}`} style={{ width: '50%', paddingBottom: 10 }}>
                  <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>{spec.label}</Text>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Customer Reviews</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#FFF2C6' }}>
                  <Ionicons name="star" size={12} color={colors.yellow} />
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.dark }}>{product.rating}</Text>
                </View>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.gray200 }}>
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.dark }}>({product.reviews.length})</Text>
                </View>
              </View>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>View reviews</Text>
            </View>

            <View style={{ marginTop: 12, gap: 16 }}>
              {product.reviews.slice(0, 2).map((review) => (
                <View key={review.id} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Image source={{ uri: review.user.avatarUrl }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gray300 }} />
                      <View>
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{review.user.name}</Text>
                        <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>{review.user.roleOrTag}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="star" size={12} color={colors.yellow} />
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.dark }}>{review.rating}</Text>
                    </View>
                  </View>

                  <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                    {review.text}
                  </Text>

                  {review.photos.length > 0 ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {review.photos.map((photo) => (
                        <Image key={photo} source={{ uri: photo }} style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: colors.white }} />
                      ))}
                    </View>
                  ) : null}

                  <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray500 }}>
                    {review.weeksAgo} weeks ago
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>Recommendations</Text>
            {recommended.length === 0 ? (
              <View style={{ marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.gray200, padding: 12, alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={18} color={colors.gray500} />
                <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  No recommendations available.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {recommended.map((item) => (
                  <View key={item.id} style={{ width: '48%' }}>
                    <ProductCard
                      product={item}
                      onPress={() => navigation.push('ProductDetails', { productId: item.id })}
                      onAddToCart={() => addToCart(item.id, 1)}
                      onToggleFavourite={() => toggleFavourite(item.id)}
                      isFavourite={favourites.includes(item.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: stickyBottom,
          flexDirection: 'row',
          gap: 12,
          zIndex: 20,
          elevation: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => toggleFavourite(product.id)}
          style={{
            flex: 1,
            height: 58,
            borderRadius: 58,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={16} color={colors.white} />
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.white }}>Add to Fav</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={{
            flex: 1,
            height: 58,
            borderRadius: 58,
            backgroundColor: colors.dark,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Ionicons name="cart" size={16} color={colors.white} />
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.white }}>Add to cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailsScreen;




