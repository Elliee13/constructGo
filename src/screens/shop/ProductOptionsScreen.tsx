import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useToastStore } from '../../stores/toastStore';
import { formatPrice } from '../../utils/format';

const ProductOptionsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const productId = route.params?.productId ?? 'p1';
  const products = useProductStore((s) => s.products);
  const product = products.find((item) => item.id === productId) ?? products[0];
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.showToast);

  const [qty, setQty] = useState(1);
  const initialSelection = useMemo(() => {
    if (!product?.optionGroups?.length) return {} as Record<string, string>;
    const mapping: Record<string, string> = {};
    product.optionGroups.forEach((group) => {
      if (!group.required && group.options[0]?.id) {
        mapping[group.id] = group.options[0].id;
      }
    });
    return mapping;
  }, [product]);

  const [selected, setSelected] = useState<Record<string, string>>(initialSelection);

  React.useEffect(() => {
    setSelected(initialSelection);
    setQty(1);
  }, [productId, initialSelection]);

  const handleSelect = (groupId: string, optionId: string) => {
    setSelected((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const selectedOptions = useMemo(() => {
    if (!product?.optionGroups) return [];
    return product.optionGroups
      .map((group) => {
        const selectedId = selected[group.id];
        if (!selectedId) return null;
        const option = group.options.find((opt) => opt.id === selectedId);
        if (!option) return null;
        return {
          groupId: group.id,
          groupName: group.label,
          optionId: option.id,
          label: option.label,
          priceDelta: option.priceDelta,
        };
      })
      .filter(Boolean) as Array<{
      groupId: string;
      groupName: string;
      optionId: string;
      label: string;
      priceDelta: number;
    }>;
  }, [product, selected]);

  const missingRequiredGroups = useMemo(() => {
    if (!product?.optionGroups?.length) return 0;
    return product.optionGroups.filter((group) => group.required && !selected[group.id]).length;
  }, [product, selected]);

  const selectedUnitPrice = useMemo(() => {
    if (!product) return 0;
    const optionsTotal = selectedOptions.reduce((sum, option) => sum + (option.priceDelta ?? 0), 0);
    return product.price + optionsTotal;
  }, [product, selectedOptions]);

  const isAddDisabled = product.stock <= 0 || !product.isActive || missingRequiredGroups > 0;

  const optionPriceLabel = (option: { priceDelta: number }) => {
    if (!product) return '';
    if (product.id === 'tools-nails-001') {
      return `${formatPrice(product.price + option.priceDelta)} per kilo`;
    }
    return '';
  };

  const handleAdd = () => {
    if (!product) return;
    if (missingRequiredGroups > 0) {
      showToast({ type: 'warning', title: 'Selection required', message: 'Please select all required options.' });
      return;
    }
    if (!product.isActive) {
      showToast({ type: 'warning', title: 'Unavailable', message: 'This item is not available.' });
      return;
    }
    if (product.stock <= 0) {
      showToast({ type: 'error', title: 'Out of stock', message: 'This item is out of stock.' });
      return;
    }

    const safeQty = Math.min(qty, product.stock);
    const added = addItem(product.id, safeQty, selectedOptions);
    if (added) {
      navigation.navigate('MyCart');
    }
  };

  if (!product) return null;

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[layout.container, { paddingTop: 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={20} color={colors.dark} />
          </TouchableOpacity>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>{product.name}</Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>
            {formatPrice(selectedUnitPrice)}
            {product.id === 'tools-nails-001' ? ' per kilo' : ''}
          </Text>

          <View style={{ marginTop: 16, gap: 16 }}>
            {product.optionGroups?.map((group) => (
              <View key={group.id}>
                <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>{group.label}</Text>
                <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {group.options.map((option) => {
                    const isSelected = selected[group.id] === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() => handleSelect(group.id, option.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.dark : colors.gray300,
                          backgroundColor: isSelected ? colors.dark : colors.white,
                        }}
                      >
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: isSelected ? colors.white : colors.dark }}>
                          {option.label}
                          {optionPriceLabel(option) ? ` (${optionPriceLabel(option)})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Quantity</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: product.stock > 0 ? colors.gray600 : '#B3261E' }}>
                {product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}
              </Text>
              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setQty((prev) => Math.max(1, prev - 1))}
                  disabled={qty <= 1}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: qty <= 1 ? colors.gray100 : colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="remove" size={16} color={colors.dark} />
                </TouchableOpacity>
                <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>{qty}</Text>
                <TouchableOpacity
                  onPress={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                  disabled={product.stock <= 0 || qty >= product.stock}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: product.stock <= 0 || qty >= product.stock ? colors.gray100 : colors.gray200, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="add" size={16} color={colors.dark} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAdd}
              disabled={isAddDisabled}
              style={{ height: 58, borderRadius: 58, backgroundColor: isAddDisabled ? colors.gray300 : colors.dark, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: typography.fonts.semibold, color: isAddDisabled ? colors.gray600 : colors.white }}>Add to cart</Text>
            </TouchableOpacity>
            {missingRequiredGroups > 0 ? (
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                Select all required options before adding to cart.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductOptionsScreen;
