import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import { useNotificationStore } from './notificationStore';

export type DriverChatSender = 'driver' | 'customer';

export type DriverChatMessage = {
  id: string;
  sender: DriverChatSender;
  text: string;
  timestamp: number;
};

export type DriverChatThread = {
  orderId: string;
  messages: DriverChatMessage[];
};

type DriverChatState = {
  threads: Record<string, DriverChatThread>;
  ensureThread: (orderId: string) => void;
  getThread: (orderId: string) => DriverChatThread | undefined;
  sendMessage: (orderId: string, text: string, sender?: DriverChatSender) => void;
};

const createStarterThread = (orderId: string): DriverChatThread => ({
  orderId,
  messages: [
    {
      id: `${orderId}-welcome`,
      sender: 'customer',
      text: 'Hello, please keep me updated on this delivery.',
      timestamp: Date.now(),
    },
  ],
});

export const useDriverChatStore = create<DriverChatState>()(
  persist(
    (set, get) => ({
      threads: {},
      ensureThread: (orderId) => {
        if (get().threads[orderId]) return;
        set((state) => ({
          threads: {
            ...state.threads,
            [orderId]: createStarterThread(orderId),
          },
        }));
      },
      getThread: (orderId) => get().threads[orderId],
      sendMessage: (orderId, text, sender = 'driver') => {
        const cleaned = text.trim();
        if (!cleaned) return;

        const existing = get().threads[orderId] ?? createStarterThread(orderId);
        const nextMessage: DriverChatMessage = {
          id: `${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sender,
          text: cleaned,
          timestamp: Date.now(),
        };

        set((state) => ({
          threads: {
            ...state.threads,
            [orderId]: {
              orderId,
              messages: [...(state.threads[orderId]?.messages ?? existing.messages), nextMessage],
            },
          },
        }));

        if (sender === 'driver') {
          useNotificationStore.getState().addNotification({
            scope: 'driver',
            orderId,
            title: 'New message sent',
            message: `Message sent for ${orderId}.`,
            status: 'Chat',
            eventType: `chat_sent_${orderId}_${nextMessage.id}`,
          });
        }
      },
    }),
    {
      name: 'driver-chat-store',
      storage: zustandStorage,
    }
  )
);
