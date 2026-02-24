import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

export type NotificationScope = 'customer' | 'driver' | 'store_owner';

export type AppNotification = {
  id: string;
  orderId: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  isRead: boolean;
  scope: NotificationScope;
  dedupeKey: string;
};

type AddNotificationPayload = Omit<AppNotification, 'id' | 'createdAt' | 'isRead' | 'scope' | 'dedupeKey'> & {
  scope?: NotificationScope;
  dedupeKey?: string;
  eventType?: string;
};

type NotificationState = {
  notifications: AppNotification[];
  unreadCount: number;
  unreadCountDriver: number;
  unreadCountStoreOwner: number;
  addNotification: (payload: AddNotificationPayload) => void;
  markRead: (notificationId: string) => void;
  markAllRead: (scope?: NotificationScope) => void;
  clearAll: () => void;
};

const calcUnread = (notifications: AppNotification[], scope: NotificationScope) =>
  notifications.reduce((sum, item) => sum + (item.scope === scope && !item.isRead ? 1 : 0), 0);

const withUnread = (notifications: AppNotification[]) => ({
  notifications,
  unreadCount: calcUnread(notifications, 'customer'),
  unreadCountDriver: calcUnread(notifications, 'driver'),
  unreadCountStoreOwner: calcUnread(notifications, 'store_owner'),
});

const buildDedupeKey = (payload: AddNotificationPayload, scope: NotificationScope) =>
  payload.dedupeKey ?? `${scope}:${payload.orderId}:${payload.eventType ?? payload.status}`;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      unreadCountDriver: 0,
      unreadCountStoreOwner: 0,
      addNotification: (payload) => {
        const scope = payload.scope ?? 'customer';
        const dedupeKey = buildDedupeKey(payload, scope);
        const exists = get().notifications.some((item) => item.dedupeKey === dedupeKey);
        if (exists) return;

        const next: AppNotification = {
          ...payload,
          scope,
          dedupeKey,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        const notifications = [next, ...get().notifications];
        set(withUnread(notifications));
      },
      markRead: (notificationId) => {
        const notifications = get().notifications.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        );
        set(withUnread(notifications));
      },
      markAllRead: (scope) => {
        const targetScope = scope ?? 'customer';
        const notifications = get().notifications.map((item) =>
          item.scope === targetScope ? { ...item, isRead: true } : item
        );
        set(withUnread(notifications));
      },
      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
          unreadCountDriver: 0,
          unreadCountStoreOwner: 0,
        }),
    }),
    {
      name: 'notification-store',
      storage: zustandStorage,
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<NotificationState> | undefined),
        } as NotificationState;

        merged.notifications = (merged.notifications ?? []).map((item) => {
          const scope = item.scope ?? 'customer';
          return {
            ...item,
            scope,
            dedupeKey: item.dedupeKey ?? `${scope}:${item.orderId}:${item.status}`,
          };
        });
        merged.unreadCount = calcUnread(merged.notifications, 'customer');
        merged.unreadCountDriver = calcUnread(merged.notifications, 'driver');
        merged.unreadCountStoreOwner = calcUnread(merged.notifications, 'store_owner');
        return merged;
      },
    }
  )
);
