import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import type { CartItem, SelectedOption } from './cartStore';
import { currentOrders, historyOrders } from '../data/orders';
import { useNotificationStore } from './notificationStore';
import { useToastStore } from './toastStore';
import { useDriverStore } from './driverStore';
import { useProductStore } from './productStore';
import { useStoreOwnerProfileStore } from './storeOwnerProfileStore';
import { acceptDriverForOrder, assignDriverToOrder } from '../api/ordersService';
import type { DriverDecision, OrderActor, OrderStatus, PaymentMethod, PaymentStatus } from '../types/order';

export type { OrderStatus } from '../types/order';

export type OrderItem = {
  cartItemId: string;
  productId: string;
  qty: number;
  selectedOptions?: SelectedOption[];
  unitPrice: number;
  itemTotal: number;
};

export type OrderInventory = {
  reserved: boolean;
  reservedAt?: number;
  deducted: boolean;
  deductedAt?: number;
  restocked: boolean;
  restockedAt?: number;
};

export type OrderPack = {
  items: Record<string, { packedQty: number }>;
  allPacked: boolean;
  packedAt?: number;
};

export type OrderSubstitutionStatus = 'none' | 'proposed' | 'accepted' | 'rejected';

export type OrderSubstitution = {
  status: OrderSubstitutionStatus;
  originalProductId: string;
  substituteProductId?: string;
  proposedQty?: number;
  proposedAt?: number;
  resolvedAt?: number;
};

export type DriverVehicle = {
  type: string;
  model: string;
  color: string;
  plate: string;
};

export type DriverMeta = {
  idCode: string;
  verified: boolean;
  registrationText: string;
  insuranceText: string;
};

export type VerifyChecklist = {
  correctModel: boolean;
  goodCondition: boolean;
  accessoriesIncluded: boolean;
  packagingSecure: boolean;
};

export type Order = {
  id: string;
  code: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryOption: string;
  deliveryOptionFee: number;
  total: number;
  status: OrderStatus;
  address: string;
  payment: string;
  createdAt: string;
  cancelReason?: string;
  cancelReasonDetails?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  driverDecision?: DriverDecision;
  declinedByDriverIds?: string[];
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRatingBase: number;
  driverVehicle: DriverVehicle;
  driverMeta: DriverMeta;
  deliveryRating?: number;
  deliveryFeedback?: string;
  verifyChecklist?: VerifyChecklist;
  reportIssue?: boolean;
  backendOrderId?: string;
  paymentProvider?: 'paymongo';
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentCheckoutUrl?: string;
  inventory: OrderInventory;
  pack: OrderPack;
  substitutions: Record<string, OrderSubstitution>;
};

const statusTimers: Record<string, NodeJS.Timeout[]> = {};

interface OrderState {
  orders: Order[];
  createOrderFromCart: (
    cartItems: CartItem[],
    deliveryOption: string,
    address: string,
    payment: string,
    priceLookup: (productId: string, selectedOptions?: SelectedOption[]) => number
  ) => Order | null;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    notificationMeta?: { title?: string; message?: string; eventType?: string }
  ) => void;
  setDriverAssignment: (
    orderId: string,
    patch: {
      assignedDriverId?: string;
      assignedDriverName?: string;
      driverDecision?: DriverDecision;
      declinedByDriverIds?: string[];
    }
  ) => Promise<void>;
  attachPaymentMeta: (
    orderId: string,
    meta: {
      backendOrderId: string;
      paymentCheckoutUrl: string;
      paymentMethod: Exclude<PaymentMethod, 'cod'>;
      paymentStatus?: PaymentStatus;
    }
  ) => void;
  updatePaymentStatusByBackendOrderId: (backendOrderId: string, status: PaymentStatus) => void;
  acceptStoreOrder: (orderId: string) => boolean;
  rejectStoreOrder: (orderId: string, reason?: string) => boolean;
  markPreparing: (orderId: string) => boolean;
  markReadyForPickup: (orderId: string) => boolean;
  proposeSubstitution: (orderId: string, lineKey: string, substituteProductId: string, qty?: number) => boolean;
  acceptSubstitution: (orderId: string, lineKey: string) => boolean;
  rejectSubstitution: (orderId: string, lineKey: string) => boolean;
  setPackedQty: (orderId: string, lineKey: string, qty: number) => boolean;
  togglePackedLine: (orderId: string, lineKey: string) => boolean;
  setPackedAll: (orderId: string, value: boolean) => boolean;
  sendToDrivers: (orderId: string) => boolean;
  acceptDriverRequest: (orderId: string, driverId: string, driverName: string) => Promise<boolean>;
  declineDriverRequest: (orderId: string, driverId: string, reason?: string) => boolean;
  markDeliveredByDriver: (orderId: string) => boolean;
  cancelOrder: (orderId: string, reason?: string, reasonDetails?: string, by?: OrderActor) => boolean;
  saveDeliveryReview: (orderId: string, rating: number, feedback: string) => void;
  updateVerifyChecklist: (orderId: string, patch: Partial<VerifyChecklist>) => void;
  setReportIssue: (orderId: string, value: boolean) => void;
  startStatusSimulation: (orderId: string) => void;
  getActiveOrders: () => Order[];
  getHistoryOrders: () => Order[];
}

const activeStatuses: OrderStatus[] = ['Driver Requested', 'Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Out for Delivery'];
const historyStatuses: OrderStatus[] = ['Delivered', 'Cancelled'];
const closedStatuses: OrderStatus[] = ['Delivered', 'Cancelled'];

const customerCancelable = new Set<OrderStatus>(['Driver Requested', 'Pending', 'Processing', 'Preparing', 'Ready for Pickup']);
const driverCancelable = new Set<OrderStatus>(['Driver Requested', 'Out for Delivery']);
const storeOwnerCancelable = new Set<OrderStatus>(['Pending', 'Processing', 'Preparing', 'Ready for Pickup', 'Driver Requested']);
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const uiTrace = (...args: unknown[]) => {
  console.info('>>>> [UI_TRACE]', ...args);
};

const driverPool: Array<{
  id: string;
  name: string;
  phone: string;
  ratingBase: number;
  vehicle: DriverVehicle;
  meta: DriverMeta;
}> = [
  {
    id: 'drv-01',
    name: 'Miguel Santos',
    phone: '+63 917 810 4451',
    ratingBase: 4.8,
    vehicle: { type: 'Motorcycle', model: 'Honda Click 160', color: 'Black', plate: 'ABC 1234' },
    meta: {
      idCode: 'GS-DR-2024-0891',
      verified: true,
      registrationText: 'OR/CR verified until Dec 2026',
      insuranceText: 'Comprehensive policy active',
    },
  },
  {
    id: 'drv-02',
    name: 'Jessa Ramos',
    phone: '+63 917 435 2012',
    ratingBase: 4.9,
    vehicle: { type: 'Van', model: 'Suzuki APV', color: 'White', plate: 'QWE 7850' },
    meta: {
      idCode: 'GS-DR-2024-0913',
      verified: true,
      registrationText: 'OR/CR verified until Aug 2026',
      insuranceText: 'Cargo coverage active',
    },
  },
  {
    id: 'drv-03',
    name: 'Paolo Rivera',
    phone: '+63 920 661 5509',
    ratingBase: 4.7,
    vehicle: { type: 'Pickup', model: 'Toyota Hilux', color: 'Gray', plate: 'JKL 4602' },
    meta: {
      idCode: 'GS-DR-2024-0957',
      verified: true,
      registrationText: 'OR/CR verified until Mar 2027',
      insuranceText: 'Commercial insurance active',
    },
  },
];

const defaultChecklist: VerifyChecklist = {
  correctModel: false,
  goodCondition: false,
  accessoriesIncluded: false,
  packagingSecure: false,
};

const pickDriver = (seedKey: string) => {
  let hash = 0;
  for (let i = 0; i < seedKey.length; i += 1) {
    hash += seedKey.charCodeAt(i);
  }
  return driverPool[hash % driverPool.length];
};

const normalizeStatus = (status?: string): OrderStatus => {
  if (status === 'Ready') return 'Ready for Pickup';
  if (!status) return 'Pending';
  return status as OrderStatus;
};

const computeAllPacked = (items: OrderItem[], packItems: Record<string, { packedQty: number }>) => {
  if (items.length === 0) return false;
  return items.every((item) => {
    const packedQty = packItems[item.cartItemId]?.packedQty ?? 0;
    return packedQty >= item.qty;
  });
};

const normalizePack = (
  items: OrderItem[],
  existingPack: Partial<OrderPack> | undefined,
  status: OrderStatus
): OrderPack => {
  const packItems: Record<string, { packedQty: number }> = {};

  items.forEach((item) => {
    const existingQty = existingPack?.items?.[item.cartItemId]?.packedQty ?? 0;
    const fallbackQty = status === 'Delivered' ? item.qty : 0;
    const packedQty = Math.max(0, Math.min(item.qty, Math.floor(existingQty || fallbackQty)));
    packItems[item.cartItemId] = { packedQty };
  });

  const allPacked =
    typeof existingPack?.allPacked === 'boolean'
      ? existingPack.allPacked || computeAllPacked(items, packItems)
      : computeAllPacked(items, packItems);

  return {
    items: packItems,
    allPacked,
    packedAt: existingPack?.packedAt,
  };
};

const normalizeSubstitutions = (
  items: OrderItem[],
  existingSubstitutions: Record<string, OrderSubstitution> | undefined
) => {
  const normalized: Record<string, OrderSubstitution> = {};
  items.forEach((item) => {
    const existing = existingSubstitutions?.[item.cartItemId];
    normalized[item.cartItemId] = {
      status: existing?.status ?? 'none',
      originalProductId: existing?.originalProductId ?? item.productId,
      substituteProductId: existing?.substituteProductId,
      proposedQty: existing?.proposedQty,
      proposedAt: existing?.proposedAt,
      resolvedAt: existing?.resolvedAt,
    };
  });
  return normalized;
};

const normalizeOrder = (input: Partial<Order> & { id: string; code: string }): Order => {
  const selectedDriver = input.driverId
    ? driverPool.find((driver) => driver.id === input.driverId) ?? pickDriver(input.id)
    : pickDriver(input.id);

  const normalizedStatus = normalizeStatus(input.status);

  const derivedDecision: DriverDecision =
    input.driverDecision ??
    (normalizedStatus === 'Cancelled' || normalizedStatus === 'Delivered'
      ? 'accepted'
      : normalizedStatus === 'Driver Requested' || normalizedStatus === 'Pending'
        ? 'pending'
        : 'accepted');

  const normalizedItems = (input.items ?? []).map((item) => {
    const qty = Math.max(1, item.qty ?? 1);
    const derivedUnitPrice =
      typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
        ? item.unitPrice
        : qty > 0
          ? item.itemTotal / qty
          : 0;
    return {
      ...item,
      qty,
      unitPrice: derivedUnitPrice,
      itemTotal:
        typeof item.itemTotal === 'number' && Number.isFinite(item.itemTotal)
          ? item.itemTotal
          : derivedUnitPrice * qty,
    };
  });

  return {
    id: input.id,
    code: input.code,
    items: normalizedItems,
    subtotal: input.subtotal ?? 0,
    deliveryFee: input.deliveryFee ?? 50,
    deliveryOption: input.deliveryOption ?? 'Standard',
    deliveryOptionFee: input.deliveryOptionFee ?? 30,
    total: input.total ?? 0,
    status: normalizedStatus,
    address: input.address ?? 'Tagum City',
    payment: input.payment ?? 'Cash on Delivery',
    createdAt: input.createdAt ?? new Date().toISOString(),
    cancelReason: input.cancelReason,
    cancelReasonDetails: input.cancelReasonDetails ?? '',
    assignedDriverId:
      input.assignedDriverId ?? (derivedDecision === 'accepted' ? input.driverId ?? selectedDriver.id : undefined),
    assignedDriverName:
      input.assignedDriverName ?? (derivedDecision === 'accepted' ? input.driverName ?? selectedDriver.name : undefined),
    driverDecision: derivedDecision,
    declinedByDriverIds: [...new Set(input.declinedByDriverIds ?? [])],
    driverId: input.driverId ?? selectedDriver.id,
    driverName: input.driverName ?? selectedDriver.name,
    driverPhone: input.driverPhone ?? selectedDriver.phone,
    driverRatingBase: input.driverRatingBase ?? selectedDriver.ratingBase,
    driverVehicle: input.driverVehicle ?? selectedDriver.vehicle,
    driverMeta: input.driverMeta ?? selectedDriver.meta,
    deliveryRating: input.deliveryRating,
    deliveryFeedback: input.deliveryFeedback ?? '',
    verifyChecklist: { ...defaultChecklist, ...(input.verifyChecklist ?? {}) },
    reportIssue: Boolean(input.reportIssue),
    backendOrderId: input.backendOrderId,
    paymentProvider: input.paymentProvider,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    paymentCheckoutUrl: input.paymentCheckoutUrl,
    inventory: {
      reserved: Boolean(input.inventory?.reserved),
      reservedAt: input.inventory?.reservedAt,
      deducted:
        typeof input.inventory?.deducted === 'boolean'
          ? input.inventory.deducted
          : normalizedStatus === 'Delivered',
      deductedAt: input.inventory?.deductedAt,
      restocked: Boolean(input.inventory?.restocked),
      restockedAt: input.inventory?.restockedAt,
    },
    pack: normalizePack(normalizedItems, input.pack, normalizedStatus),
    substitutions: normalizeSubstitutions(normalizedItems, input.substitutions),
  };
};

const seedOrders: Order[] = [...currentOrders, ...historyOrders].map((order) =>
  normalizeOrder({
    id: order.id,
    code: order.code,
    items: [
      {
        cartItemId: `${order.id}-item`,
        productId: order.productId,
        qty: order.quantity,
        unitPrice: order.quantity > 0 ? order.subtotal / order.quantity : order.subtotal,
        itemTotal: order.subtotal,
      },
    ],
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    deliveryOption: 'Standard',
    deliveryOptionFee: 30,
    total: order.total,
    status: order.status as OrderStatus,
    address: 'Tagum City',
    payment: 'Cash on Delivery',
    createdAt: order.createdAt,
    deliveryRating: order.status === 'Delivered' ? order.rating : undefined,
  })
);

const addScopedNotification = (
  scope: 'customer' | 'driver' | 'store_owner',
  orderId: string,
  title: string,
  message: string,
  status: string,
  eventType?: string
) => {
  useNotificationStore.getState().addNotification({
    scope,
    orderId,
    title,
    message,
    status,
    eventType,
  });
};

const pushCustomerStatusNotification = (
  orderId: string,
  orderCode: string,
  status: OrderStatus,
  notificationMeta?: { title?: string; message?: string; eventType?: string }
) => {
  addScopedNotification(
    'customer',
    orderId,
    notificationMeta?.title ?? 'Order Update',
    notificationMeta?.message ?? `${orderCode} is now ${status}`,
    status,
    notificationMeta?.eventType ?? status
  );
};

const isClosed = (status: OrderStatus) => closedStatuses.includes(status);
const toStockLines = (items: OrderItem[]) => items.map((item) => ({ productId: item.productId, qty: item.qty }));
const hasPendingSubstitutions = (order: Order) =>
  Object.values(order.substitutions ?? {}).some((entry) => entry.status === 'proposed');
const recalcTotals = (order: Order, items: OrderItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const total = subtotal + order.deliveryFee + order.deliveryOptionFee;
  return { subtotal, total };
};

const inferPaymentMethod = (payment: string): PaymentMethod => {
  const normalized = payment.trim().toLowerCase();
  if (normalized.includes('gcash')) return 'gcash';
  if (normalized.includes('maya')) return 'maya';
  return 'cod';
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: seedOrders,
      createOrderFromCart: (cartItems, deliveryOption, address, payment, priceLookup) => {
        const storeActive = useStoreOwnerProfileStore.getState().isActive;
        if (!storeActive) {
          useToastStore.getState().showToast({
            type: 'warning',
            title: 'Store unavailable',
            message: 'Orders are temporarily unavailable for this store.',
          });
          return null;
        }

        const orderId = `ord-${Date.now()}`;
        const code = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
        const driver = pickDriver(orderId);
        const items: OrderItem[] = cartItems.map((item) => {
          const unitPrice = priceLookup(item.productId, item.selectedOptions);
          return {
            cartItemId: item.id,
            productId: item.productId,
            qty: item.qty,
            selectedOptions: item.selectedOptions,
            unitPrice,
            itemTotal: unitPrice * item.qty,
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
        const deliveryFee = 50;
        const deliveryOptionFeeMap: Record<string, number> = {
          Priority: 50,
          Standard: 30,
          Saver: 20,
          'Order for Later': 0,
        };
        const deliveryOptionFee = deliveryOptionFeeMap[deliveryOption] ?? 0;
        const total = subtotal + deliveryFee + deliveryOptionFee;

        const reserveResult = useProductStore.getState().reserveStock(toStockLines(items));
        if (!reserveResult.ok) {
          useToastStore.getState().showToast({
            type: 'info',
            title: 'Checkout blocked',
            message: reserveResult.message ?? 'Stock changed. Please review your cart.',
          });
          return null;
        }

        const order: Order = normalizeOrder({
          id: orderId,
          code,
          items,
          subtotal,
          deliveryFee,
          deliveryOption,
          deliveryOptionFee,
          total,
          status: 'Pending',
          address,
          payment,
          paymentMethod: inferPaymentMethod(payment),
          paymentStatus: inferPaymentMethod(payment) === 'cod' ? 'paid' : 'pending',
          createdAt: new Date().toISOString(),
          driverId: driver.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          driverRatingBase: driver.ratingBase,
          driverVehicle: driver.vehicle,
          driverMeta: driver.meta,
          inventory: {
            reserved: true,
            reservedAt: Date.now(),
            deducted: false,
            restocked: false,
          },
          pack: {
            items: items.reduce<Record<string, { packedQty: number }>>((acc, item) => {
              acc[item.cartItemId] = { packedQty: 0 };
              return acc;
            }, {}),
            allPacked: false,
          },
        });

        set({ orders: [order, ...get().orders] });
        useDriverStore.getState().ensureDriverFromOrder(order);
        pushCustomerStatusNotification(order.id, order.code, order.status);
        addScopedNotification(
          'store_owner',
          order.id,
          'New Order Placed',
          `${order.code} is waiting for store review (reserved stock).`,
          order.status,
          'store_new_order'
        );
        useToastStore.getState().showToast({
          type: 'success',
          title: 'Order placed',
          message: `${order.code} has been created.`,
        });

        return order;
      },
      updateOrderStatus: (orderId, status, notificationMeta) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status === status) return;

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  inventory:
                    status === 'Delivered'
                      ? {
                          ...order.inventory,
                          deducted: true,
                          deductedAt: order.inventory.deductedAt ?? Date.now(),
                        }
                      : order.inventory,
                }
              : order
          ),
        });

        pushCustomerStatusNotification(orderId, target.code, status, notificationMeta);

        if (status === 'Delivered') {
          useToastStore.getState().showToast({
            type: 'success',
            title: 'Order delivered',
            message: `${target.code} has been delivered.`,
          });
        }

        if (status === 'Cancelled') {
          useToastStore.getState().showToast({
            type: 'error',
            title: 'Order cancelled',
            message: `${target.code} was cancelled.`,
          });
        }
      },
      setDriverAssignment: async (orderId, patch) => {
        const driverId = patch.assignedDriverId;
        const targetOrder = get().orders.find((order) => order.id === orderId || order.backendOrderId === orderId);
        const backendOrderId = targetOrder?.backendOrderId ?? (uuidRegex.test(orderId) ? orderId : undefined);

        if (__DEV__) {
          console.log('[UI] Assign Driver pressed', { orderId: backendOrderId ?? orderId, driverId: driverId ?? null });
        }

        if (!driverId) {
          const message = 'Missing driverId for assignment';
          if (__DEV__) {
            console.log('[UI] Assign Driver failed', { message });
          }
          throw new Error(message);
        }
        if (!backendOrderId) {
          const message = 'Missing backend order id for assignment';
          if (__DEV__) {
            console.log('[UI] Assign Driver failed', { message });
          }
          throw new Error(message);
        }

        try {
          const response = await assignDriverToOrder(backendOrderId, driverId);

          set({
            orders: get().orders.map((order) =>
              order.id === orderId || order.backendOrderId === response.id
                ? {
                    ...order,
                    assignedDriverId: response.driverId ?? patch.assignedDriverId ?? order.assignedDriverId,
                    assignedDriverName: patch.assignedDriverName ?? order.assignedDriverName,
                    driverDecision:
                      patch.driverDecision ?? (response.fulfillmentStatus === 'assigned' ? 'accepted' : order.driverDecision),
                    declinedByDriverIds: patch.declinedByDriverIds ?? order.declinedByDriverIds,
                    status:
                      response.fulfillmentStatus === 'delivered'
                        ? 'Delivered'
                        : response.fulfillmentStatus === 'assigned'
                          ? 'Out for Delivery'
                          : order.status,
                  }
                : order
            ),
          });

          if (__DEV__) {
            console.log('[UI] Assign Driver success', {
              id: response.id,
              fulfillmentStatus: response.fulfillmentStatus,
              driverId: response.driverId,
              assignedAt: response.assignedAt,
            });
          }
        } catch (error) {
          if (__DEV__) {
            console.log('[UI] Assign Driver failed', {
              message: error instanceof Error ? error.message : 'Request failed',
            });
          }
          throw error;
        }
      },
      attachPaymentMeta: (orderId, meta) => {
        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  backendOrderId: meta.backendOrderId,
                  paymentProvider: 'paymongo',
                  paymentMethod: meta.paymentMethod,
                  paymentStatus: meta.paymentStatus ?? 'pending',
                  paymentCheckoutUrl: meta.paymentCheckoutUrl,
                }
              : order
          ),
        });
      },
      updatePaymentStatusByBackendOrderId: (backendOrderId, status) => {
        set({
          orders: get().orders.map((order) =>
            order.backendOrderId === backendOrderId
              ? {
                  ...order,
                  paymentStatus: status,
                }
              : order
          ),
        });
      },
      acceptStoreOrder: (orderId) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Pending' || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId ? { ...order, status: 'Processing' } : order
          ),
        });

        addScopedNotification('customer', orderId, 'Order Accepted', `${target.code} is now Processing`, 'Processing', 'store_accept');
        addScopedNotification('store_owner', orderId, 'Order Accepted', `${target.code} moved to Processing`, 'Processing', 'store_accept');
        return true;
      },
      rejectStoreOrder: (orderId, reason = 'Rejected by store') => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Pending' || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        const shouldRestock =
          target.inventory.reserved && !target.inventory.restocked && target.status !== 'Delivered';
        if (shouldRestock) {
          useProductStore.getState().restockStock(toStockLines(target.items));
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'Cancelled',
                  cancelReason: reason,
                  cancelReasonDetails: '',
                  inventory: shouldRestock
                    ? {
                        ...order.inventory,
                        restocked: true,
                        restockedAt: Date.now(),
                      }
                    : order.inventory,
                }
              : order
          ),
        });

        const rejectMessage = shouldRestock
          ? `${target.code} was rejected by store and items were restocked`
          : `${target.code} was rejected by store`;
        addScopedNotification('customer', orderId, 'Order Rejected', rejectMessage, 'Cancelled', 'store_reject');
        addScopedNotification('store_owner', orderId, 'Order Rejected', `${target.code} moved to history`, 'Cancelled', 'store_reject');
        return true;
      },
      markPreparing: (orderId) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Processing' || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId ? { ...order, status: 'Preparing' } : order
          ),
        });

        addScopedNotification('customer', orderId, 'Order Update', `${target.code} is now Preparing`, 'Preparing', 'store_preparing');
        addScopedNotification('store_owner', orderId, 'Order Update', `${target.code} marked as Preparing`, 'Preparing', 'store_preparing');
        return true;
      },
      markReadyForPickup: (orderId) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Preparing' || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        if (hasPendingSubstitutions(target)) {
          useToastStore.getState().showToast({
            type: 'info',
            title: 'Substitution pending',
            message: 'Resolve all substitutions before marking Ready',
          });
          return false;
        }

        if (!target.pack.allPacked) {
          useToastStore.getState().showToast({
            type: 'info',
            title: 'Packing required',
            message: 'Pack all items before marking Ready',
          });
          return false;
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId ? { ...order, status: 'Ready for Pickup' } : order
          ),
        });

        addScopedNotification('customer', orderId, 'Order Update', `${target.code} is Ready for Pickup`, 'Ready for Pickup', 'store_ready');
        addScopedNotification('store_owner', orderId, 'Order Update', `${target.code} marked ready`, 'Ready for Pickup', 'store_ready');
        return true;
      },
      proposeSubstitution: (orderId, lineKey, substituteProductId, qty) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        const line = target.items.find((item) => item.cartItemId === lineKey);
        if (!line) return false;

        const substitute = useProductStore.getState().getProductById(substituteProductId);
        if (!substitute) {
          useToastStore.getState().showToast({ type: 'info', title: 'Invalid substitute', message: 'Selected substitute not found.' });
          return false;
        }

        if (substitute.id === line.productId) {
          useToastStore.getState().showToast({ type: 'info', title: 'Invalid substitute', message: 'Choose a different substitute item.' });
          return false;
        }

        const proposedQty = Math.max(1, Math.floor(qty ?? line.qty));
        const proposedAt = Date.now();

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  substitutions: {
                    ...order.substitutions,
                    [lineKey]: {
                      status: 'proposed',
                      originalProductId: line.productId,
                      substituteProductId: substitute.id,
                      proposedQty,
                      proposedAt,
                      resolvedAt: undefined,
                    },
                  },
                }
              : order
          ),
        });

        useToastStore.getState().showToast({
          type: 'info',
          title: 'Substitution proposed',
          message: `${target.code} line updated for customer approval.`,
        });
        addScopedNotification(
          'customer',
          orderId,
          'Substitution Proposed',
          `Store proposed ${substitute.name} for ${target.code}.`,
          target.status,
          `substitute_proposed_${lineKey}_${proposedAt}`
        );
        addScopedNotification(
          'store_owner',
          orderId,
          'Substitution Proposed',
          `${target.code}: waiting for customer response.`,
          target.status,
          `substitute_proposed_${lineKey}_${proposedAt}`
        );
        return true;
      },
      acceptSubstitution: (orderId, lineKey) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || isClosed(target.status)) return false;

        const line = target.items.find((item) => item.cartItemId === lineKey);
        const substitution = target.substitutions[lineKey];
        if (!line || !substitution || substitution.status !== 'proposed' || !substitution.substituteProductId) {
          return false;
        }

        const substitute = useProductStore.getState().getProductById(substitution.substituteProductId);
        if (!substitute || !substitute.isActive) {
          useToastStore.getState().showToast({
            type: 'info',
            title: 'Substitute unavailable',
            message: 'Selected substitute is unavailable.',
          });
          return false;
        }

        const proposedQty = Math.max(1, Math.floor(substitution.proposedQty ?? line.qty));
        const reserveResult = useProductStore.getState().reserveStock([
          { productId: substitute.id, qty: proposedQty },
        ]);
        if (!reserveResult.ok) {
          useToastStore.getState().showToast({
            type: 'info',
            title: 'Substitute unavailable',
            message: reserveResult.message ?? 'Insufficient stock for substitute.',
          });
          return false;
        }

        useProductStore.getState().restockStock([{ productId: substitution.originalProductId, qty: line.qty }]);

        const nextItems = target.items.map((item) =>
          item.cartItemId === lineKey
            ? {
                ...item,
                productId: substitute.id,
                qty: proposedQty,
                selectedOptions: undefined,
                unitPrice: substitute.price,
                itemTotal: substitute.price * proposedQty,
              }
            : item
        );
        const totals = recalcTotals(target, nextItems);
        const resolvedAt = Date.now();

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: nextItems,
                  subtotal: totals.subtotal,
                  total: totals.total,
                  pack: {
                    ...order.pack,
                    items: {
                      ...order.pack.items,
                      [lineKey]: { packedQty: 0 },
                    },
                    allPacked: false,
                    packedAt: undefined,
                  },
                  substitutions: {
                    ...order.substitutions,
                    [lineKey]: {
                      ...order.substitutions[lineKey],
                      status: 'accepted',
                      resolvedAt,
                    },
                  },
                }
              : order
          ),
        });

        useToastStore.getState().showToast({
          type: 'success',
          title: 'Substitution accepted',
          message: `${substitute.name} applied to the order.`,
        });
        addScopedNotification(
          'store_owner',
          orderId,
          'Substitution Accepted',
          `${target.code} substitution was accepted.`,
          target.status,
          `substitute_accepted_${lineKey}_${resolvedAt}`
        );
        addScopedNotification(
          'customer',
          orderId,
          'Substitution Accepted',
          `${substitute.name} replaced an item in ${target.code}.`,
          target.status,
          `substitute_accepted_${lineKey}_${resolvedAt}`
        );
        if (target.assignedDriverId) {
          addScopedNotification(
            'driver',
            orderId,
            'Order Item Updated',
            `${target.code} item changed after customer approval.`,
            target.status,
            `substitute_accepted_${lineKey}_${resolvedAt}`
          );
        }
        return true;
      },
      rejectSubstitution: (orderId, lineKey) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || isClosed(target.status)) return false;
        const substitution = target.substitutions[lineKey];
        if (!substitution || substitution.status !== 'proposed') return false;

        const resolvedAt = Date.now();
        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  substitutions: {
                    ...order.substitutions,
                    [lineKey]: {
                      ...order.substitutions[lineKey],
                      status: 'rejected',
                      resolvedAt,
                    },
                  },
                }
              : order
          ),
        });

        useToastStore.getState().showToast({
          type: 'info',
          title: 'Substitution rejected',
          message: `${target.code} substitution was rejected.`,
        });
        addScopedNotification(
          'store_owner',
          orderId,
          'Substitution Rejected',
          `${target.code} substitution was rejected by customer.`,
          target.status,
          `substitute_rejected_${lineKey}_${resolvedAt}`
        );
        addScopedNotification(
          'customer',
          orderId,
          'Substitution Rejected',
          `You rejected a substitute for ${target.code}.`,
          target.status,
          `substitute_rejected_${lineKey}_${resolvedAt}`
        );
        return true;
      },
      setPackedQty: (orderId, lineKey, qty) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || isClosed(target.status)) return false;

        const targetLine = target.items.find((item) => item.cartItemId === lineKey);
        if (!targetLine) return false;

        const clampedQty = Math.max(0, Math.min(targetLine.qty, Math.floor(qty)));
        const wasAllPacked = target.pack.allPacked;

        const nextPackItems = {
          ...target.pack.items,
          [lineKey]: { packedQty: clampedQty },
        };
        const nextAllPacked = computeAllPacked(target.items, nextPackItems);
        const nextPackedAt = !wasAllPacked && nextAllPacked ? Date.now() : target.pack.packedAt;

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  pack: {
                    items: nextPackItems,
                    allPacked: nextAllPacked,
                    packedAt: nextPackedAt,
                  },
                }
              : order
          ),
        });

        if (!wasAllPacked && nextAllPacked) {
          useToastStore.getState().showToast({
            type: 'success',
            title: 'Order packed',
            message: `${target.code} is packed and ready for next step.`,
          });
          addScopedNotification('customer', orderId, 'Order Packed', `${target.code} has been packed`, 'Preparing', 'store_packed');
          addScopedNotification('store_owner', orderId, 'Order Packed', `${target.code} is fully packed`, 'Preparing', 'store_packed');
        }

        return true;
      },
      togglePackedLine: (orderId, lineKey) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || isClosed(target.status)) return false;
        const line = target.items.find((item) => item.cartItemId === lineKey);
        if (!line) return false;
        const currentPacked = target.pack.items[lineKey]?.packedQty ?? 0;
        const nextQty = currentPacked >= line.qty ? 0 : line.qty;
        return get().setPackedQty(orderId, lineKey, nextQty);
      },
      setPackedAll: (orderId, value) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || isClosed(target.status)) return false;
        const nextPackItems = target.items.reduce<Record<string, { packedQty: number }>>((acc, item) => {
          acc[item.cartItemId] = { packedQty: value ? item.qty : 0 };
          return acc;
        }, {});
        const nextAllPacked = computeAllPacked(target.items, nextPackItems);
        const nextPackedAt = !target.pack.allPacked && nextAllPacked ? Date.now() : target.pack.packedAt;

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  pack: {
                    items: nextPackItems,
                    allPacked: nextAllPacked,
                    packedAt: nextPackedAt,
                  },
                }
              : order
          ),
        });

        if (!target.pack.allPacked && nextAllPacked) {
          useToastStore.getState().showToast({
            type: 'success',
            title: 'Order packed',
            message: `${target.code} is packed and ready for next step.`,
          });
          addScopedNotification('customer', orderId, 'Order Packed', `${target.code} has been packed`, 'Preparing', 'store_packed');
          addScopedNotification('store_owner', orderId, 'Order Packed', `${target.code} is fully packed`, 'Preparing', 'store_packed');
        }

        return true;
      },
      sendToDrivers: (orderId) => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Ready for Pickup' || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'Driver Requested',
                  driverDecision: 'pending',
                  assignedDriverId: undefined,
                  assignedDriverName: undefined,
                  declinedByDriverIds: [],
                }
              : order
          ),
        });

        addScopedNotification('customer', orderId, 'Finding Driver', `${target.code} is waiting for driver acceptance`, 'Driver Requested', 'store_send_driver');
        addScopedNotification('driver', orderId, 'New Delivery Request', `${target.code} is available for delivery.`, 'Driver Requested', 'store_send_driver');
        addScopedNotification('store_owner', orderId, 'Sent to Drivers', `${target.code} moved to Driver Requested`, 'Driver Requested', 'store_send_driver');
        return true;
      },
      acceptDriverRequest: async (orderId, driverId, driverName) => {
        uiTrace('CALLED_acceptDriverRequest_v1', { localOrderId: orderId, driverId });
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Driver Requested' || isClosed(target.status)) {
          uiTrace('DRIVER_ACCEPT_FAIL', {
            localOrderId: orderId,
            backendOrderId: target?.backendOrderId ?? null,
            driverId,
            fulfillmentStatus: null,
            reason: 'action_not_allowed',
          });
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        const backendOrderId = target.backendOrderId;
        uiTrace('DRIVER_ACCEPT_START', {
          localOrderId: orderId,
          backendOrderId: backendOrderId ?? null,
          driverId,
          fulfillmentStatus: null,
        });

        if (!backendOrderId || !uuidRegex.test(backendOrderId)) {
          const error = new Error('Missing backend order id for driver acceptance');
          uiTrace('DRIVER_ACCEPT_FAIL', {
            localOrderId: orderId,
            backendOrderId: backendOrderId ?? null,
            driverId,
            fulfillmentStatus: null,
            message: error.message,
          });
          throw error;
        }

        try {
          const response = await acceptDriverForOrder(backendOrderId);

          set({
            orders: get().orders.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    assignedDriverId: response.driverId ?? driverId,
                    assignedDriverName: driverName,
                    driverDecision: 'accepted',
                    status: 'Out for Delivery',
                  }
                : order
            ),
          });

          addScopedNotification(
            'customer',
            orderId,
            'Driver Assigned',
            `${target.code} accepted by ${driverName}.`,
            'Out for Delivery',
            'driver_accepted'
          );
          addScopedNotification(
            'driver',
            orderId,
            'Delivery Accepted',
            `${target.code} accepted for delivery.`,
            'Out for Delivery',
            'driver_accepted'
          );
          addScopedNotification(
            'store_owner',
            orderId,
            'Driver Accepted',
            `${target.code} accepted by ${driverName}.`,
            'Out for Delivery',
            'driver_accepted'
          );

          uiTrace('DRIVER_ACCEPT_SUCCESS', {
            localOrderId: orderId,
            backendOrderId,
            driverId: response.driverId ?? driverId,
            fulfillmentStatus: response.fulfillmentStatus,
          });

          return true;
        } catch (error) {
          uiTrace('DRIVER_ACCEPT_FAIL', {
            localOrderId: orderId,
            backendOrderId,
            driverId,
            fulfillmentStatus: null,
            message: error instanceof Error ? error.message : 'Request failed',
          });
          throw error;
        }
      },
      declineDriverRequest: (orderId, driverId, reason = 'Declined by driver') => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Driver Requested' || isClosed(target.status)) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        const declinedByDriverIds = [...new Set([...(target.declinedByDriverIds ?? []), driverId])];

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  driverDecision: 'pending',
                  assignedDriverId: undefined,
                  assignedDriverName: undefined,
                  declinedByDriverIds,
                }
              : order
          ),
        });

        addScopedNotification(
          'customer',
          orderId,
          'Delivery Update',
          `${target.code} was declined by a driver and re-queued.`,
          'Driver Requested',
          'driver_declined'
        );
        addScopedNotification(
          'driver',
          orderId,
          'Request Declined',
          `${target.code} declined (${reason}).`,
          'Declined',
          `driver_declined_${driverId}`
        );
        addScopedNotification(
          'store_owner',
          orderId,
          'Driver Declined',
          `${target.code} was declined and re-queued.`,
          'Driver Requested',
          `driver_declined_${driverId}`
        );

        return true;
      },
      markDeliveredByDriver: (orderId) => {
        uiTrace('CALLED_markDeliveredByDriver_v1', { localOrderId: orderId });
        const target = get().orders.find((order) => order.id === orderId);
        if (!target || target.status !== 'Out for Delivery') {
          uiTrace('DRIVER_DELIVER_FAIL', {
            localOrderId: orderId,
            backendOrderId: target?.backendOrderId ?? null,
            driverId: target?.assignedDriverId ?? null,
            fulfillmentStatus: null,
            reason: 'action_not_allowed',
          });
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }
        uiTrace('DRIVER_DELIVER_START', {
          localOrderId: orderId,
          backendOrderId: target.backendOrderId ?? null,
          driverId: target.assignedDriverId ?? null,
          fulfillmentStatus: 'assigned',
        });

        if (statusTimers[orderId]) {
          statusTimers[orderId].forEach((timer) => clearTimeout(timer));
          delete statusTimers[orderId];
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'Delivered',
                  inventory: {
                    ...order.inventory,
                    deducted: true,
                    deductedAt: order.inventory.deductedAt ?? Date.now(),
                  },
                }
              : order
          ),
        });

        addScopedNotification(
          'customer',
          orderId,
          'Order Delivered',
          `${target.code} has been delivered successfully.`,
          'Delivered',
          'driver_delivered'
        );
        uiTrace('DRIVER_DELIVER_SUCCESS', {
          localOrderId: orderId,
          backendOrderId: target.backendOrderId ?? null,
          driverId: target.assignedDriverId ?? null,
          fulfillmentStatus: 'delivered',
        });
        addScopedNotification(
          'driver',
          orderId,
          'Delivery Completed',
          `${target.code} marked as delivered.`,
          'Delivered',
          'driver_delivered'
        );
        addScopedNotification(
          'store_owner',
          orderId,
          'Order Delivered',
          `${target.code} delivery completed.`,
          'Delivered',
          'driver_delivered'
        );

        useToastStore.getState().showToast({
          type: 'success',
          title: 'Order delivered',
          message: `${target.code} has been delivered.`,
        });

        return true;
      },
      cancelOrder: (orderId, reason = 'Cancelled by user', reasonDetails = '', by: OrderActor = 'customer') => {
        const target = get().orders.find((order) => order.id === orderId);
        if (!target) return false;

        if (isClosed(target.status)) {
          useToastStore.getState().showToast({
            type: 'warning',
            title: 'Order already closed',
            message: 'Order already closed',
          });
          return false;
        }

        const allowed =
          by === 'driver'
            ? driverCancelable.has(target.status)
            : by === 'store_owner'
              ? storeOwnerCancelable.has(target.status)
              : customerCancelable.has(target.status);
        if (!allowed) {
          useToastStore.getState().showToast({ type: 'warning', title: 'Action not allowed', message: 'Action not allowed' });
          return false;
        }

        if (statusTimers[orderId]) {
          statusTimers[orderId].forEach((timer) => clearTimeout(timer));
          delete statusTimers[orderId];
        }

        const details = reasonDetails.trim();
        const shouldRestock =
          target.inventory.reserved && !target.inventory.restocked && target.status !== 'Delivered';
        if (shouldRestock) {
          useProductStore.getState().restockStock(toStockLines(target.items));
        }

        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'Cancelled',
                  cancelReason: reason,
                  cancelReasonDetails: details,
                  inventory: shouldRestock
                    ? {
                        ...order.inventory,
                        restocked: true,
                        restockedAt: Date.now(),
                      }
                    : order.inventory,
                }
              : order
          ),
        });

        const reasonSuffix = details ? ` (${details})` : '';
        const cancelMessage = shouldRestock
          ? `${target.code} was cancelled - ${reason}${reasonSuffix}. Items were restocked.`
          : `${target.code} was cancelled - ${reason}${reasonSuffix}`;

        addScopedNotification(
          'customer',
          orderId,
          'Order Cancelled',
          cancelMessage,
          'Cancelled',
          `cancelled_${by}`
        );
        addScopedNotification(
          'driver',
          orderId,
          'Delivery Cancelled',
          `${target.code} was cancelled - ${reason}${reasonSuffix}`,
          'Cancelled',
          `cancelled_${by}`
        );
        addScopedNotification(
          'store_owner',
          orderId,
          'Order Cancelled',
          `${target.code} was cancelled - ${reason}${reasonSuffix}`,
          'Cancelled',
          `cancelled_${by}`
        );

        useToastStore.getState().showToast({
          type: 'error',
          title: 'Order cancelled',
          message: `${target.code} was cancelled.`,
        });

        return true;
      },
      saveDeliveryReview: (orderId, rating, feedback) => {
        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  deliveryRating: rating,
                  deliveryFeedback: feedback,
                }
              : order
          ),
        });
      },
      updateVerifyChecklist: (orderId, patch) => {
        set({
          orders: get().orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  verifyChecklist: {
                    ...defaultChecklist,
                    ...(order.verifyChecklist ?? {}),
                    ...patch,
                  },
                }
              : order
          ),
        });
      },
      setReportIssue: (orderId, value) => {
        set({
          orders: get().orders.map((order) => (order.id === orderId ? { ...order, reportIssue: value } : order)),
        });
      },
      startStatusSimulation: (orderId) => {
        const order = get().orders.find((entry) => entry.id === orderId);
        if (!order) return;
        if (order.driverDecision !== 'accepted') return;
        if (!['Processing', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(order.status)) return;

        if (statusTimers[orderId]) return;

        const timers: NodeJS.Timeout[] = [];
        timers.push(
          setTimeout(() => get().updateOrderStatus(orderId, 'Preparing', { eventType: 'sim_preparing' }), 5000),
          setTimeout(() => get().updateOrderStatus(orderId, 'Ready for Pickup', { eventType: 'sim_ready' }), 10000),
          setTimeout(() => get().updateOrderStatus(orderId, 'Out for Delivery', { eventType: 'sim_out_for_delivery' }), 15000),
          setTimeout(() => get().updateOrderStatus(orderId, 'Delivered', { eventType: 'sim_delivered' }), 20000)
        );
        statusTimers[orderId] = timers;
      },
      getActiveOrders: () => get().orders.filter((order) => activeStatuses.includes(order.status)),
      getHistoryOrders: () => get().orders.filter((order) => historyStatuses.includes(order.status)),
    }),
    {
      name: 'order-store',
      storage: zustandStorage,
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<OrderState> | undefined),
        } as OrderState;
        const sourceOrders = !merged.orders || merged.orders.length === 0 ? seedOrders : merged.orders;
        merged.orders = sourceOrders.map((order) => normalizeOrder(order));
        merged.orders.forEach((order) => useDriverStore.getState().ensureDriverFromOrder(order));
        return merged;
      },
    }
  )
);
