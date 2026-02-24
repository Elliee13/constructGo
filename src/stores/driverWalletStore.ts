import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import type { Order } from './orderStore';
import { useNotificationStore } from './notificationStore';

export type DriverWalletTransaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  label: string;
  orderId?: string;
  timestamp: number;
};

type DriverWalletState = {
  balance: number;
  transactions: DriverWalletTransaction[];
  creditFromDelivery: (order: Order) => boolean;
  withdraw: (amount: number) => boolean;
};

export const useDriverWalletStore = create<DriverWalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      creditFromDelivery: (order) => {
        const alreadyCredited = get().transactions.some(
          (entry) => entry.type === 'credit' && entry.orderId === order.id
        );
        if (alreadyCredited) return false;

        const baseFee = 80;
        const distanceBonus = 20;
        const tip = Number((order as any).tip ?? 0);
        const totalEarnings = baseFee + distanceBonus + tip;

        const tx: DriverWalletTransaction = {
          id: `wallet-credit-${order.id}`,
          type: 'credit',
          amount: totalEarnings,
          label: 'Delivery earnings',
          orderId: order.id,
          timestamp: Date.now(),
        };

        set((state) => ({
          balance: state.balance + totalEarnings,
          transactions: [tx, ...state.transactions],
        }));

        useNotificationStore.getState().addNotification({
          scope: 'driver',
          orderId: order.id,
          title: 'Earnings added',
          message: `${order.code} earnings credited.`,
          status: 'Wallet',
          eventType: `wallet_credit_${order.id}`,
        });

        return true;
      },
      withdraw: (amount) => {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) return false;
        if (value > get().balance) return false;

        const tx: DriverWalletTransaction = {
          id: `wallet-debit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'debit',
          amount: value,
          label: 'Withdrawal request',
          timestamp: Date.now(),
        };

        set((state) => ({
          balance: state.balance - value,
          transactions: [tx, ...state.transactions],
        }));
        return true;
      },
    }),
    {
      name: 'driver-wallet-store',
      storage: zustandStorage,
    }
  )
);
