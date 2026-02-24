import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors, typography } from '../../theme/theme';
import { formatPrice } from '../../utils/format';
import AppCard from '../../components/ui/AppCard';

type DriverWithdrawScreenProps = {
  balance: number;
  amount: string;
  onAmountChange: (value: string) => void;
};

const DriverWithdrawScreen = ({ balance, amount, onAmountChange }: DriverWithdrawScreenProps) => {
  return (
    <AppCard style={{ marginTop: 14, padding: 12 }}>
      <Text style={{ fontFamily: typography.fonts.semibold, color: colors.dark }}>Withdraw</Text>
      <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Available amount</Text>
      <Text style={{ marginTop: 2, fontFamily: typography.fonts.bold, fontSize: 20, color: colors.dark }}>{formatPrice(balance)}</Text>
      <Text style={{ marginTop: 8, fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Method: GCash **** 1198</Text>

      <TextInput
        value={amount}
        onChangeText={onAmountChange}
        keyboardType="numeric"
        placeholder="Enter amount"
        placeholderTextColor={colors.gray500}
        style={{
          marginTop: 12,
          height: 46,
          borderWidth: 1,
          borderColor: colors.gray300,
          borderRadius: 8,
          paddingHorizontal: 12,
          fontFamily: typography.fonts.regular,
          color: colors.dark,
          fontSize: 14,
          backgroundColor: colors.white,
        }}
      />

      <Text style={{ marginTop: 10, fontFamily: typography.fonts.regular, fontSize: 11, color: colors.error }}>
        Withdrawals are reviewed and may take up to 24 hours.
      </Text>
    </AppCard>
  );
};

export default DriverWithdrawScreen;
