import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverAccountStackParamList } from '../../navigation/DriverAccountStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, radii, typography } from '../../theme/theme';
import { useToastStore } from '../../stores/toastStore';
import { formatPrice } from '../../utils/format';
import { useDriverWalletStore } from '../../stores/driverWalletStore';
import AppScreen from '../../components/ui/AppScreen';
import AppHeader from '../../components/ui/AppHeader';
import DriverWalletOverviewScreen from './DriverWalletOverviewScreen';
import DriverTransactionsScreen from './DriverTransactionsScreen';
import DriverWithdrawScreen from './DriverWithdrawScreen';

const DriverWalletScreen = () => {
  useHideTabs('DriverTabs');
  const navigation = useNavigation<NativeStackNavigationProp<DriverAccountStackParamList>>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'Overview' | 'Transactions' | 'Withdraw'>('Overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const balance = useDriverWalletStore((s) => s.balance);
  const transactions = useDriverWalletStore((s) => s.transactions);
  const withdraw = useDriverWalletStore((s) => s.withdraw);
  const showToast = useToastStore((s) => s.showToast);

  const deliveredCredits = useMemo(
    () => transactions.filter((item) => item.type === 'credit' && item.label === 'Delivery earnings'),
    [transactions]
  );
  const todayCredits = useMemo(
    () => deliveredCredits.filter((item) => new Date(item.timestamp).toDateString() === new Date().toDateString()),
    [deliveredCredits]
  );

  const todayTotal = todayCredits.reduce((sum, item) => sum + item.amount, 0);
  const tips = 0;
  const bonus = Math.max(0, deliveredCredits.length * 10);

  const stickyBottom = Math.max(insets.bottom + 8, 16);

  const handleCashOut = () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ type: 'warning', title: 'Invalid amount', message: 'Enter a valid amount.' });
      return;
    }
    const ok = withdraw(amount);
    if (!ok) {
      showToast({ type: 'error', title: 'Insufficient balance', message: 'Cannot withdraw more than balance.' });
      return;
    }
    setWithdrawAmount('');
    showToast({ type: 'success', title: 'Withdrawal requested', message: 'Withdrawal requested.' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <AppScreen scroll style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: stickyBottom + 78 }}>
        <View style={[layout.container, { paddingTop: 12 }]}> 
          <AppHeader title="Wallet" onBack={() => navigation.goBack()} />

          <View style={{ marginTop: 12, borderRadius: radii.lg, backgroundColor: colors.dark, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray300 }}>Available Balance</Text>
              <Text style={{ marginTop: 4, fontFamily: typography.fonts.bold, fontSize: 24, color: colors.white }}>{formatPrice(balance)}</Text>
            </View>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="logo-bitcoin" size={26} color={colors.dark} />
            </View>
          </View>

          <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.gray200, padding: 10 }}>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>Today</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.semibold, color: colors.dark }}>{formatPrice(todayTotal)}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.gray200, padding: 10 }}>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>Tips</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.semibold, color: colors.dark }}>{formatPrice(tips)}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.gray200, padding: 10 }}>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 11, color: colors.gray600 }}>Bonuses</Text>
              <Text style={{ marginTop: 2, fontFamily: typography.fonts.semibold, color: colors.dark }}>{formatPrice(bonus)}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
            {['Overview', 'Transactions', 'Withdraw'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTab(item as 'Overview' | 'Transactions' | 'Withdraw')}
                style={{ flex: 1, borderRadius: 9, paddingVertical: 8, backgroundColor: tab === item ? colors.dark : colors.gray100, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 11, color: tab === item ? colors.white : colors.dark }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'Overview' ? <DriverWalletOverviewScreen deliveredCredits={deliveredCredits} /> : null}
          {tab === 'Transactions' ? <DriverTransactionsScreen transactions={transactions} /> : null}
          {tab === 'Withdraw' ? (
            <DriverWithdrawScreen balance={balance} amount={withdrawAmount} onAmountChange={setWithdrawAmount} />
          ) : null}
        </View>
      </AppScreen>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: stickyBottom }}>
        <TouchableOpacity
          onPress={handleCashOut}
          style={{ height: 58, borderRadius: 58, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: typography.fonts.semibold, color: colors.white }}>Cash Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DriverWalletScreen;
