import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import AppInput from '../../components/AppInput';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useProductStore } from '../../stores/productStore';
import { useStoreOwnerProfileStore } from '../../stores/storeOwnerProfileStore';
import { useToastStore } from '../../stores/toastStore';
import { formatPrice } from '../../utils/format';

const AdminProductsScreen = () => {
  const products = useProductStore((s) => s.products);
  const setActive = useProductStore((s) => s.setActive);
  const storeName = useStoreOwnerProfileStore((s) => s.storeName);
  const showToast = useToastStore((s) => s.showToast);

  const [query, setQuery] = useState('');
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    });
  }, [products, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 24, color: colors.dark }}>Admin Products</Text>
          <View style={{ marginTop: 12 }}>
            <AppInput value={query} onChangeText={setQuery} placeholder="Search products" />
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {filtered.length === 0 ? (
              <View style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>No products found.</Text>
              </View>
            ) : (
              filtered.map((product) => (
                <View key={product.id} style={{ borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>{product.name}</Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Store: {storeName}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Category: {product.category}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                        Price: {formatPrice(product.price)}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Stock: {product.stock}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                        Active: {product.isActive ? 'Yes' : 'No'}
                      </Text>
                    </View>

                    <Switch
                      value={product.isActive}
                      onValueChange={(value) => {
                        setActive(product.id, value);
                        showToast({
                          type: value ? 'success' : 'warning',
                          title: value ? 'Product enabled' : 'Product disabled',
                          message: `${product.name} is now ${value ? 'visible' : 'hidden'} for customers.`,
                        });
                      }}
                      thumbColor={colors.white}
                      trackColor={{ false: colors.gray300, true: colors.dark }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminProductsScreen;

