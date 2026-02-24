import React, { useMemo, useState } from 'react';
import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useFavouritesStore } from '../../stores/favouritesStore';
import { useCatalogStore } from '../../stores/catalogStore';
import AppButton from '../../components/AppButton';
import useHideTabs from '../../navigation/useHideTabs';
import { formatPrice } from '../../utils/format';
import CodBadge from '../../components/ui/CodBadge';

const MyFavouritesScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const favourites = useFavouritesStore((s) => s.favourites);
  const addManyToCart = useFavouritesStore((s) => s.addManyToCart);
  const products = useCatalogStore((s) => s.products);
  const [manageMode, setManageMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  const favouriteProducts = useMemo(
    () => products.filter((product) => favourites.includes(product.id)),
    [products, favourites]
  );

  const handleToggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleAddToCart = () => {
    const ids = manageMode ? selected : favourites;
    if (ids.length === 0) return;
    addManyToCart(ids);
  };

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const footerPaddingBottom = Math.max(insets.bottom, 10);
  const stickyHeight = 58;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: stickyHeight + footerPaddingBottom + 28 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
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
          <Text style={{ marginTop: 10, fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>My Favourites</Text>

          <View style={{ marginTop: 16, gap: 12 }}>
            {favouriteProducts.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Ionicons name="star-outline" size={30} color={colors.gray500} />
                <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>
                  No favourites yet.
                </Text>
              </View>
            ) : (
              favouriteProducts.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: colors.gray200, borderRadius: radii.lg, padding: 12 }}>
                  <Image source={{ uri: item.image }} style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: colors.white }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>{formatPrice(item.price)}</Text>
                    <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>{item.name}</Text>
                    <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{item.soldCountText}</Text>
                    <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="star" size={12} color={colors.yellow} />
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{item.rating}</Text>
                      </View>
                      {item.codAvailable ? (
                        <CodBadge />
                      ) : null}
                    </View>
                  </View>
                  {manageMode ? (
                    <TouchableOpacity onPress={() => handleToggle(item.id)} style={{ alignSelf: 'center' }}>
                      <View style={{ width: 20, height: 20, borderWidth: 2, borderColor: colors.dark, backgroundColor: selected.includes(item.id) ? colors.dark : colors.white }} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: footerPaddingBottom,
        }}
      >
        <AppButton title="Add to Cart" onPress={handleAddToCart} />
      </View>
    </SafeAreaView>
  );
};

export default MyFavouritesScreen;
