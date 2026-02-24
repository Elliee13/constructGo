import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import { useToastStore } from './toastStore';
import { useProductStore } from './productStore';

export type SelectedOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  label: string;
  priceDelta: number;
};

export type CartItem = {
  id: string;
  productId: string;
  qty: number;
  selectedOptions?: SelectedOption[];
  selected: boolean;
};

interface CartState {
  items: CartItem[];
  addItem: (productId: string, qty?: number, selectedOptions?: SelectedOption[]) => boolean;
  addToCart: (productId: string, qty?: number) => boolean;
  removeFromCart: (cartItemId: string) => void;
  setQty: (cartItemId: string, qty: number) => void;
  toggleSelectItem: (cartItemId: string) => void;
  syncWithInventory: () => void;
  clearCart: () => void;
  clearAfterOrder: (orderedIds: string[]) => void;
  cartCount: number;
}

const computeCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.qty, 0);
const getProduct = (productId: string) => useProductStore.getState().getProductById(productId);

const notify = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
  useToastStore.getState().showToast({ type, title, message });
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartCount: 0,
      addItem: (productId, qty = 1, selectedOptions) => {
        const product = getProduct(productId);
        if (!product || !product.isActive) {
          notify('Unavailable', 'This item is not available.', 'warning');
          return false;
        }
        if (product.optionGroups && product.optionGroups.length > 0) {
          const requiredGroups = product.optionGroups.filter((group) => group.required);
          const selectedCount = selectedOptions?.length ?? 0;
          if (requiredGroups.length > 0 && selectedCount < requiredGroups.length) {
            notify('Selection required', 'Please select all required options first.', 'warning');
            return false;
          }
        }

        if (product.stock <= 0) {
          notify('Out of stock', 'This item is out of stock.', 'error');
          return false;
        }

        const requestedQty = Math.max(1, Math.floor(qty));
        const currentQty = get().items
          .filter((item) => item.productId === productId)
          .reduce((sum, item) => sum + item.qty, 0);
        const available = Math.max(0, product.stock - currentQty);

        if (available <= 0) {
          notify('Out of stock', 'This item is out of stock.', 'error');
          return false;
        }

        const finalQty = Math.min(requestedQty, available);

        const newItem: CartItem = {
          id: `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId,
          qty: finalQty,
          selectedOptions,
          selected: true,
        };
        const nextItems = [...get().items, newItem];
        set({ items: nextItems, cartCount: computeCount(nextItems) });

        if (finalQty < requestedQty) {
          notify('Quantity updated', `Only ${available} left in stock.`, 'warning');
          return true;
        }

        notify('Added to cart', 'Item added successfully.', 'success');
        return true;
      },
      addToCart: (productId, qty = 1) => {
        const product = getProduct(productId);
        if (!product || !product.isActive) {
          notify('Unavailable', 'This item is not available.', 'warning');
          return false;
        }
        if (product.optionGroups && product.optionGroups.length > 0) {
          notify('Selection required', 'Please choose item options first.', 'info');
          return false;
        }

        if (product.stock <= 0) {
          notify('Out of stock', 'This item is out of stock.', 'error');
          return false;
        }

        const requestedQty = Math.max(1, Math.floor(qty));
        const currentProductQty = get().items
          .filter((item) => item.productId === productId)
          .reduce((sum, item) => sum + item.qty, 0);
        const available = Math.max(0, product.stock - currentProductQty);

        if (available <= 0) {
          notify('Out of stock', 'This item is out of stock.', 'error');
          return false;
        }

        const addQty = Math.min(requestedQty, available);

        const existing = get().items.find(
          (item) => item.productId === productId && (!item.selectedOptions || item.selectedOptions.length === 0)
        );

        if (existing) {
          const nextItems = get().items.map((item) =>
            item.id === existing.id ? { ...item, qty: item.qty + addQty } : item
          );
          set({ items: nextItems, cartCount: computeCount(nextItems) });

          if (addQty < requestedQty) {
            notify('Quantity updated', `Only ${available} left in stock.`, 'warning');
            return true;
          }

          notify('Cart updated', 'Quantity updated in cart.', 'success');
          return true;
        }

        const newItem: CartItem = {
          id: `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId,
          qty: addQty,
          selected: true,
        };
        const nextItems = [...get().items, newItem];
        set({ items: nextItems, cartCount: computeCount(nextItems) });

        if (addQty < requestedQty) {
          notify('Quantity updated', `Only ${available} left in stock.`, 'warning');
          return true;
        }

        notify('Added to cart', 'Item added successfully.', 'success');
        return true;
      },
      removeFromCart: (cartItemId) => {
        const nextItems = get().items.filter((item) => item.id !== cartItemId);
        set({ items: nextItems, cartCount: computeCount(nextItems) });
      },
      setQty: (cartItemId, qty) => {
        const target = get().items.find((item) => item.id === cartItemId);
        if (!target) return;

        const product = getProduct(target.productId);
        if (!product || !product.isActive || product.stock <= 0) {
          notify('Out of stock', 'This item is currently unavailable.');
          return;
        }

        const requested = Math.max(1, Math.floor(qty));
        const clamped = Math.min(requested, product.stock);

        const nextItems = get().items.map((item) =>
          item.id === cartItemId ? { ...item, qty: clamped } : item
        );
        set({ items: nextItems, cartCount: computeCount(nextItems) });

        if (clamped < requested) {
          notify('Quantity updated', `Only ${product.stock} left in stock.`, 'warning');
        }
      },
      toggleSelectItem: (cartItemId) => {
        const nextItems = get().items.map((item) =>
          item.id === cartItemId ? { ...item, selected: !item.selected } : item
        );
        set({ items: nextItems });
      },
      syncWithInventory: () => {
        const products = useProductStore.getState().products;
        const map = new Map(products.map((product) => [product.id, product]));
        let changed = false;
        let firstMessage = '';

        const nextItems = get().items.map((item) => {
          const product = map.get(item.productId);

          if (!product || !product.isActive || product.stock <= 0) {
            if (item.selected) {
              changed = true;
              if (!firstMessage) {
                firstMessage = `${product?.name ?? 'Item'} is out of stock`;
              }
            }
            return { ...item, selected: false };
          }

          if (item.qty > product.stock) {
            changed = true;
            if (!firstMessage) {
              firstMessage = `Only ${product.stock} left in stock`;
            }
            return { ...item, qty: product.stock };
          }

          return item;
        });

        if (!changed) return;

        set({ items: nextItems, cartCount: computeCount(nextItems) });
        notify('Cart updated', firstMessage || 'Stock changed for one or more items.', 'warning');
      },
      clearCart: () => set({ items: [], cartCount: 0 }),
      clearAfterOrder: (orderedIds) => {
        const nextItems = get().items.filter((item) => !orderedIds.includes(item.id));
        set({ items: nextItems, cartCount: computeCount(nextItems) });
      },
    }),
    {
      name: 'cart-store',
      storage: zustandStorage,
    }
  )
);
