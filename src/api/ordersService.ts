import { apiRequest } from './apiClient';

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

export const assignDriverToOrder = async (orderId: string, driverId: string) =>
  apiRequest<FulfillmentOrderResponse>(`/orders/${orderId}/assign-driver`, {
    method: 'PATCH',
    body: { driverId },
  });

export const markOrderDelivered = async (orderId: string) =>
  apiRequest<FulfillmentOrderResponse>(`/orders/${orderId}/delivered`, {
    method: 'PATCH',
  });

