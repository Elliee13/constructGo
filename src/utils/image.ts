const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const FALLBACK_PRODUCT_IMAGE = 'https://dummyimage.com/640x640/e5e5e5/2c2c2c&text=hardware';

const normalizeKeyword = (keyword: string) => {
  const cleaned = keyword
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.split(' ').filter(Boolean).join(',');
};

export const getProductImageUrl = (productId: string, keyword: string, index: number) => {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  const lock = (hashString(`${productId}-${normalized}-${index}`) % 90000) + 10000;
  return `https://loremflickr.com/640/640/${encodeURIComponent(normalized)}?lock=${lock}`;
};

export const getAvatarUrl = (seed: string) => {
  const imageId = (hashString(seed) % 70) + 1;
  return `https://i.pravatar.cc/150?img=${imageId}`;
};
