import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { products as staticProducts } from '../data/products';
import { zustandStorage } from '../utils/storage';
import { API_BASE_URL, apiRequest } from '../api/apiClient';

export type ProductReview = {
  id: string;
  user: {
    name: string;
    roleOrTag: string;
    avatarUrl: string;
  };
  rating: number;
  text: string;
  weeksAgo: number;
  photos: string[];
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductOption = {
  id: string;
  label: string;
  priceDelta: number;
};

export type ProductOptionGroup = {
  id: string;
  label: string;
  required?: boolean;
  type?: 'single';
  options: ProductOption[];
};

export type Product = {
  id: string;
  storeId?: string;
  name: string;
  price: number;
  category: string;
  image: string;
  images: string[];
  soldCount: number;
  rating: number;
  codAvailable: boolean;
  model: string;
  sku: string;
  imageKeywords: string[];
  description: string;
  soldCountText: string;
  keyFeatures: string[];
  whatsIncluded: string;
  specs: ProductSpec[];
  reviews: ProductReview[];
  recommendations: string[];
  optionGroups?: ProductOptionGroup[];
  stock: number;
  isActive: boolean;
};

type ProductPatch = Partial<Omit<Product, 'id'>>;
export type StockLineItem = { productId: string; qty: number };

type StockResult = {
  ok: boolean;
  message?: string;
};

type ProductState = {
  products: Product[];
  hasSeeded: boolean;
  seedFromStaticOnce: (seed: Product[]) => void;
  fetchProducts: () => Promise<void>;
  fetchStoreOwnerProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, patch: ProductPatch) => void;
  deleteProduct: (productId: string) => void;
  deleteProductRemote: (productId: string) => Promise<void>;
  setActive: (productId: string, isActive: boolean) => void;
  setActiveRemote: (productId: string, isActive: boolean) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  reserveStock: (items: StockLineItem[]) => StockResult;
  restockStock: (items: StockLineItem[]) => void;
  clear: () => void;
  reset: () => void;
};

type RemoteProduct = {
  id: string;
  storeId?: string;
  name: string;
  priceCents?: number;
  category: string;
  sku: string;
  description?: string | null;
  imageUrl?: string | null;
  images?: unknown;
  stock?: number;
  isActive?: boolean;
};

const normalizeProduct = (product: Product): Product => ({
  ...product,
  storeId: product.storeId ?? 'store-main',
  stock: Math.max(0, Number.isFinite(product.stock) ? Math.floor(product.stock) : 0),
  isActive: typeof product.isActive === 'boolean' ? product.isActive : true,
  images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image],
  image: product.image || product.images?.[0] || '',
});

const staticNormalized = (staticProducts as Product[]).map(normalizeProduct);
const staticById = new Map(staticNormalized.map((item) => [item.id, item]));
const staticBySku = new Map(staticNormalized.map((item) => [item.sku, item]));

const toNumberPrice = (priceCents?: number) => {
  if (!Number.isFinite(priceCents)) return 0;
  return Math.round((priceCents as number) / 100);
};

const toRemoteImageArray = (images: unknown, fallback: string[]) => {
  if (!Array.isArray(images)) return fallback;
  const valid = images.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  return valid.length > 0 ? valid : fallback;
};

const hydrateFromRemote = (remote: RemoteProduct): Product => {
  const template = staticById.get(remote.id) ?? staticBySku.get(remote.sku);
  const templateImages = template?.images?.length ? template.images : template?.image ? [template.image] : [];
  const hasTemplateImage = templateImages.length > 0;
  const remoteImages = hasTemplateImage ? templateImages : toRemoteImageArray(remote.images, []);
  const remotePrimary = hasTemplateImage ? templateImages[0] : remote.imageUrl || remoteImages[0] || '';

  const merged: Product = {
    ...(template ?? {
      id: remote.id,
      storeId: remote.storeId ?? 'store-main',
      name: remote.name,
      price: toNumberPrice(remote.priceCents),
      category: remote.category,
      image: remotePrimary,
      images: remoteImages.length > 0 ? remoteImages : [remotePrimary],
      soldCount: 0,
      rating: 4.5,
      codAvailable: true,
      model: remote.sku,
      sku: remote.sku,
      imageKeywords: [],
      description: remote.description ?? '',
      soldCountText: '0 sold',
      keyFeatures: [],
      whatsIncluded: '',
      specs: [],
      reviews: [],
      recommendations: [],
      stock: Math.max(0, Math.floor(remote.stock ?? 0)),
      isActive: remote.isActive ?? true,
    }),
    id: remote.id,
    storeId: remote.storeId ?? template?.storeId ?? 'store-main',
    name: remote.name ?? template?.name ?? '',
    price: toNumberPrice(remote.priceCents) || template?.price || 0,
    category: remote.category ?? template?.category ?? 'Tools',
    sku: remote.sku ?? template?.sku ?? remote.id,
    description: remote.description ?? template?.description ?? '',
    image: remotePrimary,
    images: remoteImages.length > 0 ? remoteImages : [remotePrimary],
    stock: Math.max(0, Math.floor(remote.stock ?? template?.stock ?? 0)),
    isActive: remote.isActive ?? template?.isActive ?? true,
  };

  return normalizeProduct(merged);
};

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: staticNormalized,
      hasSeeded: true,
      seedFromStaticOnce: (seed) => {
        if (get().hasSeeded && get().products.length > 0) return;
        set({ products: seed.map(normalizeProduct), hasSeeded: true });
      },
      fetchProducts: async () => {
        console.log('[productStore] baseURL:', API_BASE_URL ?? '<missing>');
        const response = await apiRequest<{ products: RemoteProduct[] }>('/products');
        const next = Array.isArray(response.products) ? response.products.map(hydrateFromRemote) : [];
        console.log('[productStore] fetched:', next.length);
        set({ products: next, hasSeeded: true });
        console.log('[productStore] state products:', get().products.length);
      },
      fetchStoreOwnerProducts: async () => {
        const response = await apiRequest<{ products: RemoteProduct[] }>('/store/products');
        const next = Array.isArray(response.products) ? response.products.map(hydrateFromRemote) : [];
        set({ products: next, hasSeeded: true });
      },
      addProduct: (product) => {
        set((state) => ({
          products: [normalizeProduct(product), ...state.products],
          hasSeeded: true,
        }));
      },
      updateProduct: (productId, patch) => {
        set((state) => ({
          products: state.products.map((item) =>
            item.id === productId ? normalizeProduct({ ...item, ...patch } as Product) : item
          ),
        }));
      },
      deleteProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((item) => item.id !== productId),
        }));
      },
      deleteProductRemote: async (productId) => {
        const previous = get().products;
        set({
          products: previous.filter((item) => item.id !== productId),
          hasSeeded: true,
        });

        try {
          await apiRequest<{ ok: boolean }>(`/store/products/${productId}`, { method: 'DELETE' });
          await get().fetchStoreOwnerProducts();
        } catch (error) {
          set({ products: previous, hasSeeded: true });
          throw error;
        }
      },
      setActive: (productId, isActive) => {
        set((state) => ({
          products: state.products.map((item) =>
            item.id === productId ? { ...item, isActive } : item
          ),
        }));
      },
      setActiveRemote: async (productId, isActive) => {
        const previous = get().products;
        set({
          products: previous.map((item) =>
            item.id === productId ? { ...item, isActive } : item
          ),
          hasSeeded: true,
        });

        try {
          await apiRequest<{ product: RemoteProduct }>(`/store/products/${productId}/active`, {
            method: 'PATCH',
            body: { isActive },
          });
          await get().fetchStoreOwnerProducts();
        } catch (error) {
          set({ products: previous, hasSeeded: true });
          throw error;
        }
      },
      getProductById: (productId) => get().products.find((item) => item.id === productId),
      reserveStock: (items) => {
        const aggregated = new Map<string, number>();
        items.forEach((item) => {
          const qty = Math.max(0, Math.floor(item.qty));
          aggregated.set(item.productId, (aggregated.get(item.productId) ?? 0) + qty);
        });

        const source = get().products;
        for (const [productId, qty] of aggregated.entries()) {
          const product = source.find((item) => item.id === productId);
          if (!product) return { ok: false, message: 'Item is unavailable' };
          if (!product.isActive) return { ok: false, message: `${product.name} is not available` };
          if (product.stock <= 0) return { ok: false, message: `${product.name} is out of stock` };
          if (product.stock < qty) return { ok: false, message: `Only ${product.stock} left for ${product.name}` };
        }

        set((state) => ({
          products: state.products.map((product) => {
            const qty = aggregated.get(product.id) ?? 0;
            if (qty <= 0) return product;
            return { ...product, stock: Math.max(0, product.stock - qty) };
          }),
        }));

        return { ok: true };
      },
      restockStock: (items) => {
        const aggregated = new Map<string, number>();
        items.forEach((item) => {
          const qty = Math.max(0, Math.floor(item.qty));
          aggregated.set(item.productId, (aggregated.get(item.productId) ?? 0) + qty);
        });

        if (aggregated.size === 0) return;

        set((state) => ({
          products: state.products.map((product) => {
            const qty = aggregated.get(product.id) ?? 0;
            if (qty <= 0) return product;
            return { ...product, stock: product.stock + qty };
          }),
        }));
      },
      clear: () => set({ products: staticNormalized, hasSeeded: true }),
      reset: () => {
        set({ products: [], hasSeeded: false });
        get().fetchProducts().catch(() => {});
      },
    }),
    {
      name: 'product-store',
      storage: zustandStorage,
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...(persistedState as Partial<ProductState> | undefined),
        } as ProductState;

        if (!Array.isArray(merged.products) || merged.products.length === 0) {
          merged.products = staticNormalized;
          merged.hasSeeded = true;
        } else {
          merged.products = merged.products.map(normalizeProduct);
          merged.hasSeeded = true;
        }

        return merged;
      },
    }
  )
);
