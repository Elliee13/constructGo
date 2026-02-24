import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TextInput, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useCatalogStore } from '../../stores/catalogStore';
import { useCartStore } from '../../stores/cartStore';
import { useFavouritesStore } from '../../stores/favouritesStore';
import { useToastStore } from '../../stores/toastStore';
import ProductCard from '../../components/ProductCard';
import { useNavigation } from '@react-navigation/native';
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

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [chipSort, setChipSort] = useState<ProductSortKey>('best_match');
  const [filterOpen, setFilterOpen] = useState(false);
  const [advFilter, setAdvFilter] = useState<AdvancedFilterState>(createDefaultAdvancedFilterState());
  const [draftFilter, setDraftFilter] = useState<AdvancedFilterState>(createDefaultAdvancedFilterState());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchProducts = useCatalogStore((s) => s.searchProducts);
  const addToCart = useCartStore((s) => s.addToCart);
  const navigation = useNavigation<any>();
  const showToast = useToastStore((s) => s.showToast);
  const favourites = useFavouritesStore((s) => s.favourites);
  const toggleFavourite = useFavouritesStore((s) => s.toggleFavourite);
  const activeFilterCount = countActiveFilters(advFilter, true);

  const results = useMemo(() => {
    const base = searchProducts(query);
    const filtered = applyAdvancedFilters(base, advFilter);
    const sortKey = advFilter.sortOverride && advFilter.sortOverride !== 'chip' ? advFilter.sortOverride : chipSort;
    return sortProducts(filtered, sortKey);
  }, [query, searchProducts, advFilter, chipSort]);
  const popular = ['Power Drill Set', 'Pipe cutter', 'Step Ladder', 'Pipe wrench'];
  const recommendations = ['Socket Wrench Set', 'Circular Saw'];

  const loadRecent = useCallback(async () => {
    const raw = await AsyncStorage.getItem('recent-searches');
    if (raw) setRecentSearches(JSON.parse(raw));
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const saveRecent = async (text: string) => {
    const next = [text, ...recentSearches.filter((item) => item.toLowerCase() !== text.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    await AsyncStorage.setItem('recent-searches', JSON.stringify(next));
  };

  const handleSubmit = () => {
    if (query.trim()) saveRecent(query.trim());
  };

  const applyQuery = (text: string) => {
    setQuery(text);
    if (text.trim()) saveRecent(text.trim());
  };

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

  const renderHeader = () => (
    <View
      style={{
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.yellow,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      <Ionicons name="search" size={16} color={colors.gray500} />
      <TextInput
        placeholder="Search hardware tools, and parts..."
        placeholderTextColor={colors.gray500}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        style={{ flex: 1, fontFamily: typography.fonts.regular, color: colors.dark, fontSize: 13 }}
      />
    </View>
  );

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  if (query.trim().length > 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          {renderHeader()}
        </View>
        {results.length === 0 ? (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={30} color={colors.gray500} />
            <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>No results found.</Text>
          </View>
        ) : (
          <>
            <View style={{ marginTop: 12, width: '88%', alignSelf: 'center' }}>
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
            <FlatList
              data={results}
              numColumns={2}
              keyExtractor={(item) => item.id}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }}
              renderItem={({ item }) => (
                <View style={{ flex: 1, marginBottom: 16 }}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.navigate('Home', { screen: 'ProductDetails', params: { productId: item.id } })}
                    onAddToCart={() => addToCart(item.id, 1)}
                    onToggleFavourite={() => toggleFavourite(item.id)}
                    isFavourite={favourites.includes(item.id)}
                  />
                </View>
              )}
            />
          </>
        )}
        <AdvancedFilterSheet
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          value={draftFilter}
          onChange={setDraftFilter}
          onReset={resetFilter}
          onApply={applyFilter}
          showCategoryFilter
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={{ paddingBottom: 110 }}>
        <View style={[layout.container, { marginTop: 16 }]}>
          {renderHeader()}

          <>
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time" size={16} color={colors.dark} />
                  <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark, fontSize: 16 }}>
                    Recent Searches
                  </Text>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                  {recentSearches.length === 0 ? (
                    <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray600 }}>
                      No recent searches.
                    </Text>
                  ) : (
                    recentSearches.map((item) => (
                      <TouchableOpacity key={item} onPress={() => applyQuery(item)}>
                        <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>{item}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark, fontSize: 16 }}>
                  Popular searches
                </Text>
                <View style={{ marginTop: 12, gap: 10 }}>
                  {[
                    [popular[0], popular[1]],
                    [popular[2], popular[3]],
                  ].map((row, index) => (
                    <View key={`row-${index}`} style={{ flexDirection: 'row', gap: 16 }}>
                      {row.map((item) => (
                        <TouchableOpacity key={item} onPress={() => applyQuery(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <Ionicons name="trending-up" size={16} color={colors.warning} />
                          <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark, fontSize: 16 }}>
                  Recommendations
                </Text>
                <View style={{ marginTop: 12, gap: 10 }}>
                  {recommendations.map((item) => (
                    <TouchableOpacity key={item} onPress={() => applyQuery(item)}>
                      <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View
                style={{
                  marginTop: 28,
                  height: 260,
                  borderRadius: 22,
                  backgroundColor: colors.gray100,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="search-circle" size={120} color={colors.yellow} />
              </View>
            </>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;
