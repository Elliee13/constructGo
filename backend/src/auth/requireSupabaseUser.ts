import type { NextFunction, Request, Response } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string | null;
  };
};

export const requireSupabaseUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = (await response.json()) as { id?: string; email?: string | null };
    if (!user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = { id: user.id, email: user.email ?? null };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
