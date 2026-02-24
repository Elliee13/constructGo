export type ProductSortKey = 'best_match' | 'best_seller' | 'price_asc' | 'price_desc';

export type AdvancedFilterState = {
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  codOnly?: boolean;
  inStockOnly?: boolean;
  categories?: string[];
  sortOverride?: 'chip' | ProductSortKey;
};

export type FilterableProduct = {
  price: number;
  soldCount: number;
  rating?: number;
  codAvailable?: boolean;
  codEligible?: boolean;
  isCod?: boolean;
  stock?: number;
  isActive?: boolean;
  category?: string;
};

export const createDefaultAdvancedFilterState = (): AdvancedFilterState => ({
  minPrice: null,
  maxPrice: null,
  minRating: null,
  codOnly: false,
  inStockOnly: false,
  categories: [],
  sortOverride: 'chip',
});

export const countActiveFilters = (
  filter: AdvancedFilterState,
  includeCategory: boolean
): number => {
  let count = 0;
  if (typeof filter.minPrice === 'number') count += 1;
  if (typeof filter.maxPrice === 'number') count += 1;
  if (typeof filter.minRating === 'number') count += 1;
  if (filter.codOnly) count += 1;
  if (filter.inStockOnly) count += 1;
  if (includeCategory && (filter.categories?.length ?? 0) > 0) count += 1;
  if (filter.sortOverride && filter.sortOverride !== 'chip') count += 1;
  return count;
};

export const normalizeAdvancedFilter = (filter: AdvancedFilterState) => {
  const min = typeof filter.minPrice === 'number' ? Math.max(0, filter.minPrice) : null;
  const max = typeof filter.maxPrice === 'number' ? Math.max(0, filter.maxPrice) : null;
  const swapped = typeof min === 'number' && typeof max === 'number' && min > max;

  return {
    normalized: {
      ...filter,
      minPrice: swapped ? max : min,
      maxPrice: swapped ? min : max,
      categories: filter.categories ?? [],
      sortOverride: filter.sortOverride ?? 'chip',
    } as AdvancedFilterState,
    swapped,
  };
};

export const applyAdvancedFilters = <T extends FilterableProduct>(
  source: T[],
  filter: AdvancedFilterState
) => {
  return source.filter((product) => {
    if (typeof filter.minPrice === 'number' && product.price < filter.minPrice) {
      return false;
    }
    if (typeof filter.maxPrice === 'number' && product.price > filter.maxPrice) {
      return false;
    }

    const rating = product.rating ?? 0;
    if (typeof filter.minRating === 'number' && rating < filter.minRating) {
      return false;
    }

    const cod = Boolean(product.codAvailable ?? product.codEligible ?? product.isCod);
    if (filter.codOnly && !cod) {
      return false;
    }

    if (filter.inStockOnly) {
      const isActive = product.isActive !== false;
      const stock = product.stock ?? 0;
      if (!isActive || stock <= 0) {
        return false;
      }
    }

    if ((filter.categories?.length ?? 0) > 0) {
      if (!product.category || !filter.categories?.includes(product.category)) {
        return false;
      }
    }

    return true;
  });
};

export const sortProducts = <T extends FilterableProduct>(
  source: T[],
  sortKey: ProductSortKey
) => {
  if (sortKey === 'best_seller') {
    return [...source].sort((a, b) => b.soldCount - a.soldCount);
  }
  if (sortKey === 'price_asc') {
    return [...source].sort((a, b) => a.price - b.price);
  }
  if (sortKey === 'price_desc') {
    return [...source].sort((a, b) => b.price - a.price);
  }
  return source;
};
