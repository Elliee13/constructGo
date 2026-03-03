import { apiRequest } from './apiClient';
import { getAccessToken } from '../stores/supabaseAuthStore';

export type FulfillmentOrderResponse = {
  id: string;
  status: string;
  fulfillmentStatus: string;
  storeId: string | null;
  driverId: string | null;
  approvedAt: string | null;
  assignedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
};

export const assignDriverToOrder = async (orderId: string, driverId: string) => {
  if (__DEV__) {
    const token = getAccessToken();
    console.log('[ordersService] ASSIGN_DRIVER_CALL');
    console.log('orderId:', orderId);
    console.log('driverId:', driverId);
    console.log('hasToken:', Boolean(token));
    console.log('tokenPrefix:', token ? token.slice(0, 80) : null);
  }

  return apiRequest<FulfillmentOrderResponse>(`/orders/${orderId}/assign-driver`, {
    method: 'PATCH',
    body: { driverId },
  });
};

export const acceptDriverForOrder = async (orderId: string) =>
  apiRequest<FulfillmentOrderResponse>(`/orders/${orderId}/accept-driver`, {
    method: 'PATCH',
  });

export const markOrderDelivered = async (orderId: string) =>
  apiRequest<FulfillmentOrderResponse>(`/orders/${orderId}/delivered`, {
    method: 'PATCH',
  });

