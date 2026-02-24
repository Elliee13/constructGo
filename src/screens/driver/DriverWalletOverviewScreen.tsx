import React from 'react';
import { Text, View } from 'react-native';
import { colors, typography } from '../../theme/theme';
import { formatPrice } from '../../utils/format';
import type { DriverWalletTransaction } from '../../stores/driverWalletStore';
import AppCard from '../../components/ui/AppCard';
import EmptyState from '../../components/ui/EmptyState';

type DriverWalletOverviewScreenProps = {
  deliveredCredits: DriverWalletTransaction[];
};

const DriverWalletOverviewScreen = ({ deliveredCredits }: DriverWalletOverviewScreenProps) => {
  const gross = deliveredCredits.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={{ marginTop: 14, gap: 12 }}>
      <AppCard style={{ padding: 12 }}>
        <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>This Week Summary</Text>
        <View style={{ marginTop: 8, gap: 6 }}>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
            Completed credits: {deliveredCredits.length}
          </Text>
          <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>
            Gross earnings: {formatPrice(gross)}
          </Text>
        </View>
      </AppCard>

      <AppCard style={{ padding: 12 }}>
        <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Recent Activity</Text>
        <View style={{ marginTop: 8, gap: 8 }}>
          {deliveredCredits.length === 0 ? (
            <EmptyState icon="wallet-outline" title="No delivery earnings yet." />
          ) : (
            deliveredCredits.slice(0, 3).map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.dark }}>
                  {item.orderId ?? 'Delivery'}
                </Text>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>
                  +{formatPrice(item.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </AppCard>
    </View>
  );
};

export default DriverWalletOverviewScreen;
