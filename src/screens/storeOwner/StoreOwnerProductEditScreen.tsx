import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useProductStore } from '../../stores/productStore';
import { useToastStore } from '../../stores/toastStore';

const categoryOptions = ['Tools', 'Electrical', 'Plumbing', 'Paint'];

const StoreOwnerProductEditScreen = () => {
  useHideTabs('StoreOwnerTabs');
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId = route.params?.productId as string | undefined;

  const products = useProductStore((s) => s.products);
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const showToast = useToastStore((s) => s.showToast);

  const existing = useMemo(() => products.find((item) => item.id === productId), [productId, products]);

  const [name, setName] = useState(existing?.name ?? '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '0');
  const [category, setCategory] = useState(existing?.category ?? 'Tools');
  const [stock, setStock] = useState(existing ? String(existing.stock) : '10');

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const handleSave = () => {
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!name.trim() || !Number.isFinite(parsedPrice) || !Number.isFinite(parsedStock)) {
      showToast({ type: 'info', title: 'Invalid values', message: 'Please fill all fields.' });
      return;
    }

    if (existing) {
      updateProduct(existing.id, {
        name: name.trim(),
        price: parsedPrice,
        category,
        stock: parsedStock,
      });
    } else {
      const id = `p-${Date.now()}`;
      addProduct({
        id,
        name: name.trim(),
        price: parsedPrice,
        category,
        image: '',
        images: [''],
        soldCount: 0,
        rating: 4.5,
        codAvailable: true,
        model: `MDL-${id.slice(-5)}`,
        sku: `SKU-${id.slice(-6)}`,
        imageKeywords: [name.trim().toLowerCase()],
        description: `${name.trim()} product listing`,
        soldCountText: '0 sold',
        keyFeatures: ['Durable build', 'For daily use'],
        whatsIncluded: `${name.trim()} unit`,
        specs: [
          { label: 'Category', value: category },
          { label: 'Stock', value: String(parsedStock) },
        ],
        reviews: [],
        recommendations: [],
        stock: parsedStock,
        isActive: true,
      });
    }

    showToast({ type: 'success', title: 'Saved', message: 'Product updated successfully.' });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>

          <Text style={{ marginTop: 12, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>
            {existing ? 'Edit Product' : 'Create Product'}
          </Text>

          <View style={{ marginTop: 14, gap: 12 }}>
            <AppInput value={name} onChangeText={setName} placeholder="Product name" />
            <AppInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Price" />
            <AppInput value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="Stock" />

            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 13, color: colors.dark }}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {categoryOptions.map((option) => {
                  const selected = option === category;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setCategory(option)}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: selected ? colors.dark : colors.gray300,
                        backgroundColor: selected ? colors.dark : colors.white,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: selected ? colors.white : colors.dark }}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        <AppButton title="Save Product" onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
};

export default StoreOwnerProductEditScreen;
