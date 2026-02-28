import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const DEMO_STORE_ID = 'store-main';

const toClientProduct = (product: {
  id: string;
  storeId: string;
  name: string;
  priceCents: number;
  currency: string;
  category: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  images: unknown;
  stock: number;
  isActive: boolean;
}) => ({
  id: product.id,
  storeId: product.storeId,
  name: product.name,
  priceCents: product.priceCents,
  currency: product.currency,
  category: product.category,
  sku: product.sku,
  description: product.description,
  imageUrl: product.imageUrl,
  images: product.images,
  stock: product.stock,
  isActive: product.isActive,
});

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json({ products: products.map(toClientProduct) });
  } catch (error) {
    console.error('GET /products failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStoreProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        storeId: DEMO_STORE_ID,
        deletedAt: null,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json({ products: products.map(toClientProduct) });
  } catch (error) {
    console.error('GET /store/products failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteStoreProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;

    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: DEMO_STORE_ID,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /store/products/:id failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchStoreProductActive = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const isActive = Boolean(req.body?.isActive);

    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: DEMO_STORE_ID,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
    });

    res.json({ product: toClientProduct(updated) });
  } catch (error) {
    console.error('PATCH /store/products/:id/active failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
