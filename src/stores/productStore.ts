import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { products as staticProducts } from '../data/products';
import { zustandStorage } from '../utils/storage';

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
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, patch: ProductPatch) => void;
  deleteProduct: (productId: string) => void;
  setActive: (productId: string, isActive: boolean) => void;
  getProductById: (productId: string) => Product | undefined;
  reserveStock: (items: StockLineItem[]) => StockResult;
  restockStock: (items: StockLineItem[]) => void;
  clear: () => void;
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

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: staticNormalized,
      hasSeeded: true,
      seedFromStaticOnce: (seed) => {
        if (get().hasSeeded && get().products.length > 0) return;
        set({ products: seed.map(normalizeProduct), hasSeeded: true });
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
      setActive: (productId, isActive) => {
        set((state) => ({
          products: state.products.map((item) =>
            item.id === productId ? { ...item, isActive } : item
          ),
        }));
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
          const persistedProducts = merged.products.map(normalizeProduct);
          const existingIds = new Set(persistedProducts.map((item) => item.id));
          const missingSeedProducts = staticNormalized.filter((item) => !existingIds.has(item.id));
          merged.products = [...persistedProducts, ...missingSeedProducts];
          merged.hasSeeded = true;
        }

        return merged;
      },
    }
  )
);
