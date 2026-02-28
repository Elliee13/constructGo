import { create } from 'zustand';
import { categories as seedCategories, products as seedProducts } from '../data/products';
import { useProductStore, type Product } from './productStore';
import { useStoreOwnerProfileStore } from './storeOwnerProfileStore';

export type { Product, ProductReview, ProductSpec, ProductOption, ProductOptionGroup } from './productStore';

interface CatalogState {
  products: Product[];
  categories: string[];
  getProductsByCategory: (category: string) => Product[];
  searchProducts: (query: string) => Product[];
  syncFromProductStore: () => void;
}

const deriveCategories = (products: Product[]) => {
  const fromProducts = Array.from(new Set(products.map((item) => item.category)));
  return fromProducts.length > 0 ? fromProducts : seedCategories;
};

const getVisibleProducts = (products: Product[]) => {
  const isStoreActive = useStoreOwnerProfileStore.getState().isActive;
  if (!isStoreActive) return [];
  return products.filter((product) => product.isActive !== false);
};

const syncCatalogFromSources = () => {
  const source = useProductStore.getState().products;
  useCatalogStore.setState({
    products: getVisibleProducts(source),
    categories: deriveCategories(source),
  });
};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: getVisibleProducts(useProductStore.getState().products),
  categories: deriveCategories(useProductStore.getState().products),
  getProductsByCategory: (category) =>
    get().products.filter((product) => product.category === category),
  searchProducts: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return get().products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.model.toLowerCase().includes(q)
      );
    });
  },
  syncFromProductStore: () => {
    syncCatalogFromSources();
  },
}));

useProductStore.getState().seedFromStaticOnce(seedProducts as Product[]);
useCatalogStore.getState().syncFromProductStore();
useProductStore
  .getState()
  .fetchProducts?.()
  .catch(() => {});

useProductStore.subscribe(() => {
  syncCatalogFromSources();
});

useStoreOwnerProfileStore.subscribe(() => {
  syncCatalogFromSources();
});
