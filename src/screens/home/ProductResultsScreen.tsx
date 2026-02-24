import React, { useMemo } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useCatalogStore } from '../../stores/catalogStore';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../utils/format';
import CodBadge from '../../components/ui/CodBadge';

const ProductResultsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const title = route.params?.title ?? 'Results';
  const query = route.params?.query ?? '';
  const allProducts = useCatalogStore((s) => s.products);
  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((product) => product.name.toLowerCase().includes(q));
  }, [allProducts, query]);
  const addToCart = useCartStore((s) => s.addToCart);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={[layout.container, { paddingTop: 12, paddingBottom: 12 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>{title}</Text>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: 120 }}
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              marginTop: 12,
              borderWidth: 1,
              borderColor: colors.gray200,
              borderRadius: radii.md,
              padding: 10,
            }}
          >
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: item.image }} style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: colors.white }} />
              <TouchableOpacity
                onPress={() => addToCart(item.id, 1)}
                style={{ position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="cart" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.semibold, fontSize: 12, color: colors.dark }}>
              {formatPrice(item.price)}
            </Text>
            <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
              {item.name}
            </Text>
            <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
              {Math.round(item.soldCount / 1000)}k sold
            </Text>
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={12} color={colors.yellow} />
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: colors.dark }}>{item.rating}</Text>
              </View>
              {item.codAvailable ? (
                <CodBadge />
              ) : null}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default ProductResultsScreen;
