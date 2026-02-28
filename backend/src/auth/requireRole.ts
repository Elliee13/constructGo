import type { NextFunction, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from './requireSupabaseUser.js';

export const requireRole =
  (roles: string[]) => async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!profile || !roles.includes(profile.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
