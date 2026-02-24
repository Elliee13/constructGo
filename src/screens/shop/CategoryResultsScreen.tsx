import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useCatalogStore } from '../../stores/catalogStore';
import { useCartStore } from '../../stores/cartStore';
import { useFavouritesStore } from '../../stores/favouritesStore';
import { useToastStore } from '../../stores/toastStore';
import ProductCard from '../../components/ProductCard';
import AdvancedFilterSheet from '../../components/AdvancedFilterSheet';
import {
  applyAdvancedFilters,
  countActiveFilters,
  createDefaultAdvancedFilterState,
  normalizeAdvancedFilter,
  sortProducts,
  type AdvancedFilterState,
  type ProductSortKey,
} from '../../types/filters';

const CategoryResultsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const category = route.params?.category ?? 'Tools';
  const [chipSort, setChipSort] = useState<ProductSortKey>('best_match');
  const [filterOpen, setFilterOpen] = useState(false);
  const [advFilter, setAdvFilter] = useState<AdvancedFilterState>(createDefaultAdvancedFilterState());
  const [draftFilter, setDraftFilter] = useState<AdvancedFilterState>(createDefaultAdvancedFilterState());
  const allProducts = useCatalogStore((s) => s.products);
  const showToast = useToastStore((s) => s.showToast);
  const products = useMemo(() => {
    const base = allProducts.filter((product) => product.category === category);
    const filtered = applyAdvancedFilters(base, advFilter);
    const sortKey = advFilter.sortOverride && advFilter.sortOverride !== 'chip' ? advFilter.sortOverride : chipSort;
    return sortProducts(filtered, sortKey);
  }, [allProducts, category, advFilter, chipSort]);
  const addToCart = useCartStore((s) => s.addToCart);
  const favourites = useFavouritesStore((s) => s.favourites);
  const toggleFavourite = useFavouritesStore((s) => s.toggleFavourite);
  const activeFilterCount = countActiveFilters(advFilter, false);

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const openFilter = () => {
    setDraftFilter(advFilter);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    const { normalized, swapped } = normalizeAdvancedFilter(draftFilter);
    if (swapped) {
      showToast({
        type: 'warning',
        title: 'Price range adjusted',
        message: 'Minimum and maximum values were swapped.',
      });
    }
    setAdvFilter(normalized);
    setFilterOpen(false);
  };

  const resetFilter = () => {
    const reset = createDefaultAdvancedFilterState();
    setChipSort('best_match');
    setAdvFilter(reset);
    setDraftFilter(reset);
    setFilterOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 12, paddingBottom: 12 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>{category}</Text>
        <View style={{ marginTop: 10, width: '88%', alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={() => setChipSort('best_match')}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: chipSort === 'best_match' ? colors.dark : colors.gray100,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: chipSort === 'best_match' ? colors.white : colors.dark }}>Best Match</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChipSort('best_seller')}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: chipSort === 'best_seller' ? colors.dark : colors.gray100,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: chipSort === 'best_seller' ? colors.white : colors.dark }}>Best Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChipSort((prev) => (prev === 'price_asc' ? 'price_desc' : 'price_asc'))}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: chipSort === 'price_asc' || chipSort === 'price_desc' ? colors.dark : colors.gray100,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: chipSort === 'price_asc' || chipSort === 'price_desc' ? colors.white : colors.dark }}>
                {chipSort === 'price_desc' ? 'Price ↓' : 'Price ↑'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openFilter}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.gray100 }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }}
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, marginBottom: 16 }}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
              onAddToCart={() => addToCart(item.id, 1)}
              onToggleFavourite={() => toggleFavourite(item.id)}
              isFavourite={favourites.includes(item.id)}
            />
          </View>
        )}
      />

      <AdvancedFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={draftFilter}
        onChange={setDraftFilter}
        onReset={resetFilter}
        onApply={applyFilter}
      />
    </SafeAreaView>
  );
};

export default CategoryResultsScreen;
