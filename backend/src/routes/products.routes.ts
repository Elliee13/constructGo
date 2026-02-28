import { Router } from 'express';
import { requireRole } from '../auth/requireRole.js';
import { requireSupabaseUser } from '../auth/requireSupabaseUser.js';
import {
  deleteStoreProduct,
  getProducts,
  getStoreProducts,
  patchStoreProductActive,
} from '../controllers/products.controller.js';

export const productsRouter = Router();

productsRouter.get('/products', getProducts);
productsRouter.get(
  '/store/products',
  requireSupabaseUser,
  requireRole(['store_owner', 'admin']),
  getStoreProducts
);
productsRouter.delete(
  '/store/products/:id',
  requireSupabaseUser,
  requireRole(['store_owner', 'admin']),
  deleteStoreProduct
);
productsRouter.patch(
  '/store/products/:id/active',
  requireSupabaseUser,
  requireRole(['store_owner', 'admin']),
  patchStoreProductActive
);
