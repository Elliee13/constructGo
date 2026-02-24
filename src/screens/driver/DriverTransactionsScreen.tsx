import React from 'react';
import { Text, View } from 'react-native';
import { colors, typography } from '../../theme/theme';
import { formatPrice } from '../../utils/format';
import type { DriverWalletTransaction } from '../../stores/driverWalletStore';
import AppCard from '../../components/ui/AppCard';
import EmptyState from '../../components/ui/EmptyState';

type DriverTransactionsScreenProps = {
  transactions: DriverWalletTransaction[];
};

const DriverTransactionsScreen = ({ transactions }: DriverTransactionsScreenProps) => {
  return (
    <AppCard style={{ marginTop: 14, padding: 12, gap: 10 }}>
      {transactions.length === 0 ? (
        <EmptyState icon="wallet-outline" title="No transactions yet." />
      ) : (
        transactions.map((item) => (
          <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{item.label}</Text>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>
                {item.orderId ?? new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: typography.fonts.semibold,
                fontSize: 12,
                color: item.type === 'credit' ? colors.success : colors.error,
              }}
            >
              {item.type === 'credit' ? '+' : '-'}
              {formatPrice(item.amount)}
            </Text>
          </View>
        ))
      )}
    </AppCard>
  );
};

export default DriverTransactionsScreen;
