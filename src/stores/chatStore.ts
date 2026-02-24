import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import { useNotificationStore } from './notificationStore';
import type { Order } from './orderStore';

const LEGACY_DRIVER_CHAT_KEY = 'driver-chat-store';
const MIGRATION_FLAG_KEY = 'chat-store-migration-v1';

type ChatSender = 'driver' | 'customer';

type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: number;
};

type ChatThread = {
  orderId: string;
  participants?: {
    customerName?: string;
    driverName?: string;
  };
  messages: ChatMessage[];
  updatedAt: number;
};

type ChatState = {
  threads: Record<string, ChatThread>;
  ensureThread: (orderId: string, participants?: ChatThread['participants']) => void;
  getThread: (orderId: string) => ChatThread | undefined;
  sendMessage: (orderId: string, text: string, sender: ChatSender) => void;
  seedParticipantsFromOrder: (order: Order) => void;
};

type LegacyThread = {
  orderId: string;
  messages?: Array<{ id?: string; sender?: ChatSender; text?: string; timestamp?: number }>;
};

const now = () => Date.now();

const normalizeMessage = (
  orderId: string,
  index: number,
  message: { id?: string; sender?: ChatSender; text?: string; timestamp?: number }
): ChatMessage | null => {
  const text = (message.text ?? '').trim();
  if (!text) return null;
  return {
    id: message.id ?? `${orderId}-legacy-${index}`,
    sender: message.sender === 'driver' ? 'driver' : 'customer',
    text,
    timestamp: Number.isFinite(message.timestamp) ? Number(message.timestamp) : now(),
  };
};

const normalizeLegacyThreads = (raw: string): Record<string, ChatThread> => {
  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    const threads = state?.threads as Record<string, LegacyThread> | undefined;
    if (!threads || typeof threads !== 'object') return {};

    const normalized: Record<string, ChatThread> = {};
    Object.entries(threads).forEach(([orderId, thread]) => {
      const sourceMessages = Array.isArray(thread?.messages) ? thread.messages : [];
      const messages = sourceMessages
        .map((item, index) => normalizeMessage(orderId, index, item))
        .filter((item): item is ChatMessage => Boolean(item))
        .sort((a, b) => a.timestamp - b.timestamp);

      normalized[orderId] = {
        orderId: thread?.orderId ?? orderId,
        messages,
        updatedAt: messages[messages.length - 1]?.timestamp ?? now(),
      };
    });

    return normalized;
  } catch {
    return {};
  }
};

const mergeThreads = (
  current: Record<string, ChatThread>,
  legacy: Record<string, ChatThread>
): Record<string, ChatThread> => {
  const merged: Record<string, ChatThread> = { ...current };

  Object.entries(legacy).forEach(([orderId, legacyThread]) => {
    const existing = merged[orderId];
    if (!existing) {
      merged[orderId] = legacyThread;
      return;
    }

    const messageMap = new Map<string, ChatMessage>();
    [...existing.messages, ...legacyThread.messages].forEach((message) => {
      messageMap.set(message.id, message);
    });

    const messages = [...messageMap.values()].sort((a, b) => a.timestamp - b.timestamp);
    merged[orderId] = {
      orderId,
      participants: {
        customerName: existing.participants?.customerName ?? legacyThread.participants?.customerName,
        driverName: existing.participants?.driverName ?? legacyThread.participants?.driverName,
      },
      messages,
      updatedAt: Math.max(existing.updatedAt, legacyThread.updatedAt, messages[messages.length - 1]?.timestamp ?? 0),
    };
  });

  return merged;
};

const createBaseThread = (orderId: string, participants?: ChatThread['participants']): ChatThread => ({
  orderId,
  participants,
  messages: [],
  updatedAt: now(),
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},
      ensureThread: (orderId, participants) => {
        const existing = get().threads[orderId];
        if (existing) {
          if (!participants) return;
          set((state) => ({
            threads: {
              ...state.threads,
              [orderId]: {
                ...existing,
                participants: {
                  customerName: existing.participants?.customerName ?? participants.customerName,
                  driverName: existing.participants?.driverName ?? participants.driverName,
                },
              },
            },
          }));
          return;
        }

        set((state) => ({
          threads: {
            ...state.threads,
            [orderId]: createBaseThread(orderId, participants),
          },
        }));
      },
      getThread: (orderId) => get().threads[orderId],
      sendMessage: (orderId, text, sender) => {
        const cleaned = text.trim();
        if (!cleaned) return;

        const thread = get().threads[orderId] ?? createBaseThread(orderId);
        const timestamp = now();
        const message: ChatMessage = {
          id: `${orderId}-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
          sender,
          text: cleaned,
          timestamp,
        };

        set((state) => ({
          threads: {
            ...state.threads,
            [orderId]: {
              ...thread,
              messages: [...thread.messages, message],
              updatedAt: timestamp,
            },
          },
        }));

        const scope = sender === 'driver' ? 'customer' : 'driver';
        const title = sender === 'driver' ? 'New message from driver' : 'New message from customer';

        useNotificationStore.getState().addNotification({
          scope,
          orderId,
          title,
          message: cleaned,
          status: 'Chat',
          dedupeKey: `${scope}:${orderId}:chat:${timestamp}`,
        });
      },
      seedParticipantsFromOrder: (order) => {
        get().ensureThread(order.id, {
          customerName: (order as any).customerName ?? 'Customer',
          driverName: order.driverName,
        });
      },
    }),
    {
      name: 'chat-store',
      storage: zustandStorage,
      onRehydrateStorage: () => {
        return async (state, error) => {
          if (error || !state) return;

          try {
            const migrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
            if (migrated === '1') return;

            const legacyRaw = await AsyncStorage.getItem(LEGACY_DRIVER_CHAT_KEY);
            if (!legacyRaw) {
              await AsyncStorage.setItem(MIGRATION_FLAG_KEY, '1');
              return;
            }

            const legacyThreads = normalizeLegacyThreads(legacyRaw);
            if (Object.keys(legacyThreads).length > 0) {
              useChatStore.setState((current) => ({
                threads: mergeThreads(current.threads, legacyThreads),
              }));
            }

            await AsyncStorage.removeItem(LEGACY_DRIVER_CHAT_KEY);
            await AsyncStorage.setItem(MIGRATION_FLAG_KEY, '1');
          } catch {
            // Migration is best-effort; skip on parse or storage errors.
          }
        };
      },
    }
  )
);
