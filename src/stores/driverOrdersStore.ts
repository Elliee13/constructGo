import { create } from 'zustand';
import { useDriverProfileStore } from './driverProfileStore';
import { useOrderStore, type Order } from './orderStore';
import type { OrderStatus } from '../types/order';
import { useDriverWalletStore } from './driverWalletStore';
import { useProductStore } from './productStore';

export type DriverDeliveryStatus = 'Request' | 'Accepted' | 'Delivered' | 'Cancelled' | 'Declined';

export type DriverDeliveryOrder = {
  id: string;
  orderCode: string;
  productId: string;
  productName: string;
  image: string;
  qty: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: 'COD';
  customerName: string;
  address: string;
  status: DriverDeliveryStatus;
  createdAt: string;
  reason?: string;
};

type DriverOrdersState = {
  requestQueue: DriverDeliveryOrder[];
  activeDeliveries: DriverDeliveryOrder[];
  historyDeliveries: DriverDeliveryOrder[];
  refreshFromOrders: () => void;
  acceptRequest: (orderId: string) => void;
  declineRequest: (orderId: string, reason?: string) => void;
  markDelivered: (orderId: string) => void;
  markCancelled: (orderId: string, reason?: string) => void;
  clear: () => void;
};

const getProduct = (productId?: string) => useProductStore.getState().products.find((item) => item.id === productId);

const toDriverOrder = (order: Order, statusOverride?: DriverDeliveryStatus): DriverDeliveryOrder => {
  const firstItem = order.items[0];
  const product = getProduct(firstItem?.productId);

  const mappedStatus: DriverDeliveryStatus =
    statusOverride ??
    (order.status === 'Delivered'
      ? 'Delivered'
      : order.status === 'Cancelled'
        ? 'Cancelled'
        : order.driverDecision === 'accepted'
          ? 'Accepted'
          : 'Request');

  return {
    id: order.id,
    orderCode: order.code,
    productId: firstItem?.productId ?? '',
    productName: product?.name ?? firstItem?.productName ?? 'Hardware Item',
    image: product?.image ?? firstItem?.productImage ?? 'https://dummyimage.com/96x96/e5e5e5/2c2c2c&text=tool',
    qty: firstItem?.qty ?? 1,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee + order.deliveryOptionFee,
    total: order.total,
    payment: 'COD',
    customerName: 'Customer',
    address: order.address,
    status: mappedStatus,
    createdAt: order.createdAt,
    reason: order.cancelReason,
  };
};

const requestStatus: OrderStatus = 'Driver Requested';

const deriveDriverLists = (orders: Order[]) => {
  const currentDriverId = useDriverProfileStore.getState().driverId;

  const requestQueue = orders
    .filter(
      (order) =>
        order.status === requestStatus &&
        order.driverDecision === 'pending' &&
        !(order.declinedByDriverIds ?? []).includes(currentDriverId)
    )
    .map((order) => toDriverOrder(order, 'Request'));

  const activeDeliveries = orders
    .filter(
      (order) =>
        order.driverDecision === 'accepted' &&
        order.assignedDriverId === currentDriverId &&
        !['Delivered', 'Cancelled'].includes(order.status)
    )
    .map((order) => toDriverOrder(order, 'Accepted'));

  const closedHistory = orders
    .filter(
      (order) =>
        order.assignedDriverId === currentDriverId &&
        (order.status === 'Delivered' || order.status === 'Cancelled')
    )
    .map((order) => toDriverOrder(order));

  const declinedHistory = orders
    .filter((order) => (order.declinedByDriverIds ?? []).includes(currentDriverId) && order.status === 'Driver Requested')
    .map((order) => toDriverOrder(order, 'Declined'));

  const historyDeliveries = [...declinedHistory, ...closedHistory];

  return { requestQueue, activeDeliveries, historyDeliveries };
};

export const useDriverOrdersStore = create<DriverOrdersState>((set, get) => ({
  ...deriveDriverLists(useOrderStore.getState().orders),
  refreshFromOrders: () => {
    const derived = deriveDriverLists(useOrderStore.getState().orders);
    set(derived);
  },
  acceptRequest: (orderId) => {
    const profile = useDriverProfileStore.getState();
    const ok = useOrderStore.getState().acceptDriverRequest(orderId, profile.driverId, profile.name);
    if (ok) get().refreshFromOrders();
  },
  declineRequest: (orderId, reason = 'Declined by driver') => {
    const profile = useDriverProfileStore.getState();
    const ok = useOrderStore.getState().declineDriverRequest(orderId, profile.driverId, reason);
    if (ok) get().refreshFromOrders();
  },
  markDelivered: (orderId) => {
    const ok = useOrderStore.getState().markDeliveredByDriver(orderId);
    if (ok) {
      const deliveredOrder = useOrderStore.getState().orders.find((order) => order.id === orderId);
      if (deliveredOrder) {
        useDriverWalletStore.getState().creditFromDelivery(deliveredOrder);
      }
      useDriverProfileStore.getState().incrementDeliveriesCount();
      get().refreshFromOrders();
    }
  },
  markCancelled: (orderId, reason = 'Cancelled in transit') => {
    const ok = useOrderStore.getState().cancelOrder(orderId, reason, '', 'driver');
    if (ok) get().refreshFromOrders();
  },
  clear: () => set({ requestQueue: [], activeDeliveries: [], historyDeliveries: [] }),
}));

useOrderStore.subscribe((state) => {
  const derived = deriveDriverLists(state.orders);
  useDriverOrdersStore.setState(derived);
});

