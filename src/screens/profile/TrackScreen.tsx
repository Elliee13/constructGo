import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import MapPlaceholder from '../../components/MapPlaceholder';
import useHideTabs from '../../navigation/useHideTabs';

const TrackScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 12, flex: 1 }]}> 
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Track Order</Text>

        <MapPlaceholder height={260} style={{ marginTop: 16 }} />

        <View
          style={{
            marginTop: 16,
            borderRadius: 16,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.gray200,
            padding: 14,
          }}
        >
          <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Driver Details</Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray600 }}>
            Tagum City · 2.4 km away
          </Text>
          <View style={{ marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FFF2C6' }}>
            <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: '#B37B00' }}>Out for Delivery</Text>
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, height: 48, borderRadius: 10, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CustomerChat', { orderId })}
              style={{ flex: 1, height: 48, borderRadius: 10, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TrackScreen;
