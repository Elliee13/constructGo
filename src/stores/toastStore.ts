import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export type ToastPayload = {
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
};

type ToastState = {
  toast: (ToastPayload & { id: string; durationMs: number }) | null;
  showToast: (payload: ToastPayload) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (payload) =>
    set({
      toast: {
        ...payload,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        durationMs: payload.durationMs ?? 2200,
      },
    }),
  hideToast: () => set({ toast: null }),
}));
