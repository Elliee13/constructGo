import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useProductStore } from '../../stores/productStore';
import { formatPrice } from '../../utils/format';

const StoreOwnerProductsScreen = () => {
  const navigation = useNavigation<any>();
  const products = useProductStore((s) => s.products);
  const setActive = useProductStore((s) => s.setActive);
  const deleteProduct = useProductStore((s) => s.deleteProduct);

  const [query, setQuery] = useState('');
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}> 
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Products</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('StoreOwnerProductEdit')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dark, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }}
            >
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.white }}>Add Product</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <AppInput value={query} onChangeText={setQuery} placeholder="Search products" />
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {filtered.length === 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 18, alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={24} color={colors.gray500} />
                <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>
                  No products found.
                </Text>
              </View>
            ) : (
              filtered.map((product) => (
                <View key={product.id} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{product.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        {product.category}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                        {formatPrice(product.price)}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Stock: {product.stock}
                      </Text>
                      {product.stock <= 0 ? (
                        <View style={{ marginTop: 6, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#B3261E' }}>Out of stock</Text>
                        </View>
                      ) : product.stock <= 5 ? (
                        <View style={{ marginTop: 6, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FFF2C6', paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#B37B00' }}>Low stock</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <Switch
                        value={product.isActive}
                        onValueChange={(value) => setActive(product.id, value)}
                        thumbColor={colors.white}
                        trackColor={{ false: colors.gray300, true: colors.dark }}
                      />
                      <TouchableOpacity onPress={() => navigation.navigate('StoreOwnerProductEdit', { productId: product.id })}>
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteProduct(product.id)}
                    style={{ marginTop: 8, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FCE8E8', paddingHorizontal: 10, paddingVertical: 6 }}
                  >
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#B3261E' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreOwnerProductsScreen;
