import { apiRequest } from './apiClient';

export type CreateCheckoutPayload = {
  localOrderId: string;
  localOrderCode: string;
  amountCents: number;
};

export type CreateCheckoutResponse = {
  backendOrderId: string;
  checkoutUrl: string;
};

export type BackendOrderStatus = 'pending' | 'paid' | 'failed';

export type GetOrderStatusResponse = {
  backendOrderId: string;
  status: BackendOrderStatus;
  checkoutUrl?: string | null;
  paidAt?: string | null;
};

export const createCheckout = async (payload: CreateCheckoutPayload) =>
  apiRequest<CreateCheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: payload,
  });

export const getOrderStatus = async (backendOrderId: string) =>
  apiRequest<GetOrderStatusResponse>(`/orders/${backendOrderId}`);
