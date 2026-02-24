import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity, View, SafeAreaView, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import IconBadge from '../../components/IconBadge';
import { useOrderStore } from '../../stores/orderStore';
import { useFavouritesStore } from '../../stores/favouritesStore';
import { useCartStore } from '../../stores/cartStore';
import { useCatalogStore } from '../../stores/catalogStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { formatPrice } from '../../utils/format';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const favouritesCount = useFavouritesStore((s) => s.favourites.length);
  const cartCount = useCartStore((s) => s.cartCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const orders = useOrderStore((s) => s.orders);
  const products = useCatalogStore((s) => s.products);

  const activeOrders = useMemo(
    () => orders.filter((order) => ['Driver Requested', 'Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(order.status)),
    [orders]
  );
  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const hasProcessingOrder = activeOrders.length > 0;
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const openProfileRoute = (screen: string) => {
    const parent = navigation.getParent();
    parent?.navigate('Profile', { screen } as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[layout.container, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: typography.fonts.semibold,
                fontSize: 18,
                color: colors.yellow,
              }}
            >
              ConstructGo
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => openProfileRoute('Notifications')}>
                <IconBadge icon={<Ionicons name="notifications-outline" size={20} color={colors.dark} />} count={unreadCount > 0 ? unreadCount : undefined} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openProfileRoute('MyFavourites')}>
                <IconBadge icon={<Ionicons name="star-outline" size={20} color={colors.dark} />} count={favouritesCount} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('MyCart')}>
                <IconBadge icon={<Ionicons name="cart-outline" size={20} color={colors.dark} />} count={cartCount} />
              </TouchableOpacity>
            </View>
          </View>
          {hasProcessingOrder ? (
            <View
              style={{
                marginTop: 8,
                alignSelf: 'flex-end',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.dark,
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.yellow }}>
                • Processing order
              </Text>
            </View>
          ) : null}

          <Text
            style={{
              marginTop: 16,
              fontFamily: typography.fonts.semibold,
              fontSize: 20,
              color: colors.dark,
            }}
          >
            Good Day, User!
          </Text>

          <View
            style={{
              marginTop: 12,
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
            <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Search')}>
              <Text style={{ fontFamily: typography.fonts.regular, color: colors.gray500, fontSize: 13 }}>
                Search hardware tools, and parts...
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 12,
              backgroundColor: colors.yellow,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fonts.bold, fontSize: 18, color: colors.dark }}>
                Fast Hardware Delivery
              </Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                Tools, parts & equipments
              </Text>
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: colors.dark,
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Order Now</Text>
              </View>
            </View>
            <View
              style={{
                width: 86,
                height: 86,
                borderRadius: 16,
                backgroundColor: '#F4C84E',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="construct" size={36} color={colors.dark} />
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>
              Categories
            </Text>
            <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { label: 'Tools', icon: 'hammer' },
                { label: 'Electrical', icon: 'flash' },
                { label: 'Plumbing', icon: 'water' },
                { label: 'Paint', icon: 'color-palette' },
                { label: 'More', icon: 'ellipsis-horizontal' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() =>
                    item.label === 'More'
                      ? navigation.navigate('CategoryResults', { category: 'Tools' })
                      : navigation.navigate('CategoryResults', { category: item.label })
                  }
                  style={{ alignItems: 'center', width: 64 }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: '#FFE28A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={item.icon as any} size={18} color={colors.dark} />
                  </View>
                  <Text
                    style={{
                      marginTop: 6,
                      fontFamily: typography.fonts.medium,
                      fontSize: 12,
                      color: colors.dark,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 16, color: colors.dark }}>
                Recent Orders
              </Text>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                View all
              </Text>
            </View>

            {recentOrders.length === 0 ? (
              <View style={{ marginTop: 14, alignItems: 'center', paddingVertical: 16 }}>
                <Ionicons name="cube-outline" size={30} color={colors.gray500} />
                <Text style={{ marginTop: 8, fontFamily: typography.fonts.medium, color: colors.gray600 }}>
                  No recent orders yet.
                </Text>
              </View>
            ) : (
              recentOrders.slice(0, 2).map((order) => {
                const productId = order.items[0]?.productId;
                const product = products.find((p) => p.id === productId);
                return (
                  <View key={order.id} style={{ marginTop: 14, flexDirection: 'row', gap: 12 }}>
                    <Image
                      source={{ uri: product?.images?.[0] ?? product?.image ?? 'https://dummyimage.com/64x64/e5e5e5/2c2c2c&text=tool' }}
                      style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: colors.white }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 14, color: colors.dark }}>
                        {formatPrice(order.subtotal)}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: typography.fonts.medium, fontSize: 14, color: colors.dark }}>
                        {product?.name ?? 'Order item'}
                      </Text>
                      <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                        <View
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 4,
                            borderRadius: 14,
                            backgroundColor:
                              order.status === 'Delivered'
                                ? '#DFF2E1'
                                : order.status === 'Cancelled'
                                  ? '#FCE8E8'
                                  : '#FFF2C6',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: typography.fonts.medium,
                              fontSize: 12,
                              color:
                                order.status === 'Delivered'
                                  ? '#2E7D32'
                                  : order.status === 'Cancelled'
                                    ? '#B3261E'
                                    : '#B37B00',
                            }}
                          >
                            {order.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="star" size={14} color={colors.yellow} />
                        <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                          {product?.rating ?? 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
