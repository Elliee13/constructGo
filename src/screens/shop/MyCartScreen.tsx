import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import useHideTabs from '../../navigation/useHideTabs';
import { formatPrice } from '../../utils/format';
import CodBadge from '../../components/ui/CodBadge';

const MyCartScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const items = useCartStore((s) => s.items);
  const toggleSelectItem = useCartStore((s) => s.toggleSelectItem);
  const setQty = useCartStore((s) => s.setQty);
  const syncWithInventory = useCartStore((s) => s.syncWithInventory);
  const products = useProductStore((s) => s.products);

  const [manageMode, setManageMode] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    syncWithInventory();
  }, [products, syncWithInventory]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const unitPrice = (productId: string, selectedOptions?: { priceDelta?: number }[]) => {
    const product = productMap.get(productId);
    const base = product?.price ?? 0;
    const optionsTotal =
      selectedOptions?.reduce((sum, option) => sum + (option.priceDelta ?? 0), 0) ?? 0;
    return base + optionsTotal;
  };

  const selectedIds = useMemo(() => {
    const validItems = items.filter((item) => {
      const product = productMap.get(item.productId);
      return Boolean(product && product.isActive && product.stock > 0 && product.stock >= item.qty);
    });

    if (!manageMode) return validItems.map((item) => item.id);
    return validItems.filter((item) => item.selected).map((item) => item.id);
  }, [items, manageMode, productMap]);

  const canCheckout = selectedIds.length > 0;

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const stickyBottom = Math.max(insets.bottom + 8, 16);
  const stickyHeight = 58;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 12, paddingBottom: 12 }]}> 
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setManageMode((prev) => !prev)}>
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
              {manageMode ? 'Done' : 'Manage'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>My Cart</Text>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: stickyBottom + stickyHeight + 24, paddingHorizontal: 16 }}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 28 }}>
            <Ionicons name="cube-outline" size={30} color={colors.gray500} />
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>
              Your cart is empty.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const product = productMap.get(item.productId);
          const stock = product?.stock ?? 0;
          const isAvailable = Boolean(product && product.isActive && stock > 0);
          const isValidForCheckout = Boolean(isAvailable && stock >= item.qty);

          return (
            <View style={{ marginBottom: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12, flexDirection: 'row', gap: 12 }}>
              <Image
                source={{ uri: product?.image || 'https://placehold.co/72x72' }}
                style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: colors.white }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>
                  {formatPrice(unitPrice(item.productId, item.selectedOptions))}
                </Text>
                <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>
                  {product?.name ?? 'Unavailable item'}
                </Text>
                {item.selectedOptions && item.selectedOptions.length > 0 ? (
                  <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                    {item.selectedOptions.map((option) => `${option.groupName}: ${option.label}`).join(', ')}
                  </Text>
                ) : null}
                <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
                  {product?.soldCountText ?? ''}
                </Text>
                <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={12} color={colors.yellow} />
                    <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{product?.rating ?? 0}</Text>
                  </View>
                  {product?.codAvailable ? (
                    <CodBadge />
                  ) : null}
                </View>

                <Text
                  style={{
                    marginTop: 6,
                    fontFamily: typography.fonts.regular,
                    fontSize: 11,
                    color: isAvailable ? colors.gray600 : colors.error,
                  }}
                >
                  {isAvailable ? `In stock: ${stock}` : 'Out of stock'}
                </Text>

                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    disabled={!isAvailable || item.qty <= 1}
                    onPress={() => setQty(item.id, item.qty - 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: !isAvailable || item.qty <= 1 ? colors.gray100 : colors.gray200,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="remove" size={14} color={colors.dark} />
                  </TouchableOpacity>
                  <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{item.qty}</Text>
                  <TouchableOpacity
                    disabled={!isAvailable || item.qty >= stock}
                    onPress={() => setQty(item.id, item.qty + 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: !isAvailable || item.qty >= stock ? colors.gray100 : colors.gray200,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={14} color={colors.dark} />
                  </TouchableOpacity>
                </View>

                {!isValidForCheckout ? (
                  <Text style={{ marginTop: 6, fontFamily: typography.fonts.medium, fontSize: 11, color: colors.error }}>
                    Fix stock to checkout this item.
                  </Text>
                ) : null}
              </View>

              {manageMode ? (
                <TouchableOpacity onPress={() => toggleSelectItem(item.id)} style={{ alignSelf: 'center' }}>
                  <View style={{ width: 20, height: 20, borderWidth: 2, borderColor: colors.dark, backgroundColor: item.selected ? colors.dark : colors.white }} />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: stickyBottom, zIndex: 20, elevation: 20 }}>
        <TouchableOpacity
          disabled={!canCheckout}
          onPress={() => navigation.navigate('Checkout', { cartItemIds: selectedIds })}
          style={{
            height: 58,
            borderRadius: 58,
            backgroundColor: canCheckout ? colors.dark : colors.gray300,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typography.fonts.semibold, color: canCheckout ? colors.white : colors.gray600 }}>
            Checkout
          </Text>
        </TouchableOpacity>
        {!canCheckout ? (
          <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
            Select available items to continue checkout.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default MyCartScreen;
