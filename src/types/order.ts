export type OrderStatus =
  | 'Driver Requested'
  | 'Pending'
  | 'Processing'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type DriverDecision = 'pending' | 'accepted' | 'declined';

export type OrderActor = 'customer' | 'driver' | 'store_owner';

export type PaymentMethod = 'cod' | 'gcash' | 'maya';

export type PaymentStatus = 'pending' | 'paid' | 'failed';
