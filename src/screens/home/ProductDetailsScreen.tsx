import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/ShopStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';

const ProductDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const route = useRoute<any>();
  const productId = route.params?.productId ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={[layout.container, { paddingTop: 12 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Product Details</Text>
        <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, color: colors.gray600 }}>
          Product ID: {productId}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailsScreen;
