import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from './lib/prisma.js';
import { requireSupabaseUser, type AuthenticatedRequest } from './auth/requireSupabaseUser.js';
import { productsRouter } from './routes/products.routes.js';
import { seedProductsIfEmpty } from './seed/seedProducts.js';

const app = express();

const PORT = Number(process.env.PORT ?? 4000);
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY ?? '';
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET ?? '';
const PAYMONGO_SUCCESS_URL = process.env.PAYMONGO_SUCCESS_URL ?? 'https://example.com/success';
const PAYMONGO_CANCEL_URL = process.env.PAYMONGO_CANCEL_URL ?? 'https://example.com/cancel';
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';
const jsonParser = express.json();

if (!PAYMONGO_SECRET_KEY) {
  throw new Error('Missing PAYMONGO_SECRET_KEY');
}
if (!PAYMONGO_WEBHOOK_SECRET) {
  throw new Error('Missing PAYMONGO_WEBHOOK_SECRET');
}
if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

app.use('/webhooks/paymongo', express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.path.startsWith('/webhooks/paymongo')) {
    return next();
  }
  return jsonParser(req, res, next);
});
app.use(productsRouter);

type DemoAuthedRequest = Request & { rawBody?: Buffer };

type CheckoutBody = {
  localOrderId?: string;
  localOrderCode?: string;
  amountCents?: number;
};

type AssignDriverBody = {
  driverId?: string;
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => uuidRegex.test(value);

const toValidAmountCents = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Invalid amountCents');
  }
  const rounded = Math.round(parsed);
  return Math.max(2000, rounded);
};

const paymongoAuthHeader = () => {
  const base64 = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  return `Basic ${base64}`;
};

const createPaymongoCheckoutSession = async (input: {
  backendOrderId: string;
  localOrderId: string;
  localOrderCode: string;
  amountCents: number;
}) => {
  const body = {
    data: {
      attributes: {
        billing: {
          name: 'ConstructGo Demo User',
          email: 'demo@constructgo.local',
          phone: '+639171234567',
        },
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        line_items: [
          {
            currency: 'PHP',
            amount: input.amountCents,
            name: `ConstructGo ${input.localOrderCode}`,
            quantity: 1,
            description: `Order ${input.localOrderCode}`,
          },
        ],
        payment_method_types: ['gcash', 'paymaya'],
        success_url: `${PAYMONGO_SUCCESS_URL}?backendOrderId=${input.backendOrderId}`,
        cancel_url: `${PAYMONGO_CANCEL_URL}?backendOrderId=${input.backendOrderId}`,
        reference_number: input.localOrderCode,
        metadata: {
          backendOrderId: input.backendOrderId,
          localOrderId: input.localOrderId,
          localOrderCode: input.localOrderCode,
        },
      },
    },
  };

  const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: paymongoAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    const message = json?.errors?.[0]?.detail ?? json?.errors?.[0]?.code ?? 'Failed to create checkout session';
    throw new Error(message);
  }

  const sessionId = json?.data?.id as string | undefined;
  const checkoutUrl = json?.data?.attributes?.checkout_url as string | undefined;

  if (!sessionId || !checkoutUrl) {
    throw new Error('PayMongo response missing checkout session fields');
  }

  return { checkoutSessionId: sessionId, checkoutUrl };
};

const safeCompare = (a: string, b: string) => {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const parseSignatureHeader = (signatureHeader: string) => {
  const parsed: Record<string, string> = {};
  signatureHeader.split(',').forEach((chunk) => {
    const [key, value] = chunk.split('=').map((part) => part.trim());
    if (key && value) parsed[key] = value;
  });
  return parsed;
};

const computeWebhookSignature = (timestamp: string, rawBody: Buffer) => {
  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  return crypto.createHmac('sha256', PAYMONGO_WEBHOOK_SECRET).update(signedPayload).digest('hex');
};

const verifyPaymongoSignature = (signatureHeader: string, rawBody: Buffer) => {
  const parsed = parseSignatureHeader(signatureHeader);
  const timestamp = parsed.t;
  if (!timestamp) return false;

  const expected = computeWebhookSignature(timestamp, rawBody);
  const testSig = parsed.te;
  const liveSig = parsed.li;

  if (testSig && safeCompare(expected, testSig)) return true;
  if (liveSig && safeCompare(expected, liveSig)) return true;

  return false;
};

const getEventCore = (payload: any) => {
  const data = payload?.data;
  const attributes = data?.attributes ?? {};
  return {
    eventId: data?.id as string | undefined,
    type: attributes?.type as string | undefined,
    livemode: Boolean(attributes?.livemode),
    resource: attributes?.data ?? null,
  };
};

const extractBackendOrderId = (resource: any): string | null => {
  const metadataCandidates = [
    resource?.attributes?.metadata,
    resource?.attributes?.payments?.[0]?.attributes?.metadata,
    resource?.attributes?.payment_intent?.attributes?.metadata,
    resource?.attributes?.checkout_session?.attributes?.metadata,
  ];

  for (const metadata of metadataCandidates) {
    const backendOrderId = metadata?.backendOrderId;
    if (typeof backendOrderId === 'string' && backendOrderId.length > 0) {
      return backendOrderId;
    }
  }

  return null;
};

const extractCheckoutSessionId = (resource: any): string | null => {
  const direct = resource?.id;
  if (typeof direct === 'string' && direct.startsWith('cs_')) return direct;

  const nested = resource?.attributes?.checkout_session_id ?? resource?.attributes?.checkout_session?.id;
  if (typeof nested === 'string' && nested.length > 0) return nested;

  return null;
};

const extractPaymongoPaymentId = (resource: any): string | null => {
  const paymentId =
    resource?.attributes?.payments?.[0]?.id ??
    resource?.attributes?.payment_intent?.id ??
    resource?.attributes?.payments?.[0]?.attributes?.id;

  return typeof paymentId === 'string' ? paymentId : null;
};

const isPrismaUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

const paymentOrderFulfillmentSelect = {
  id: true,
  status: true,
  fulfillmentStatus: true,
  storeId: true,
  driverId: true,
  approvedAt: true,
  assignedAt: true,
  deliveredAt: true,
  updatedAt: true,
} as const;

const ensureRole = async (userId: string, role: 'store_owner' | 'driver') => {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return profile?.role === role;
};

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/payments/checkout', requireSupabaseUser, async (req: AuthenticatedRequest & Request<{}, {}, CheckoutBody>, res) => {
  try {
    const localOrderId = req.body.localOrderId?.trim();
    const localOrderCode = req.body.localOrderCode?.trim();

    if (!localOrderId || !localOrderCode) {
      res.status(400).json({ error: 'localOrderId and localOrderCode are required' });
      return;
    }

    const amountCents = toValidAmountCents(req.body.amountCents);

    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId: req.user!.id,
        localOrderId,
        localOrderCode,
        amountCents,
        currency: 'PHP',
        status: 'pending',
      },
    });

    const checkout = await createPaymongoCheckoutSession({
      backendOrderId: paymentOrder.id,
      localOrderId,
      localOrderCode,
      amountCents,
    });

    await prisma.paymongoPayment.create({
      data: {
        paymentOrderId: paymentOrder.id,
        checkoutSessionId: checkout.checkoutSessionId,
        checkoutUrl: checkout.checkoutUrl,
        status: 'pending',
      },
    });

    res.json({
      backendOrderId: paymentOrder.id,
      checkoutUrl: checkout.checkoutUrl,
    });
  } catch (error) {
    console.error('POST /payments/checkout failed', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.get('/orders/:backendOrderId', requireSupabaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const backendOrderId = req.params.backendOrderId;

    const order = await prisma.paymentOrder.findFirst({
      where: { id: backendOrderId, userId: req.user!.id },
      include: {
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      backendOrderId: order.id,
      status: order.status,
      checkoutUrl: order.payment?.checkoutUrl ?? null,
      paidAt: order.payment?.paidAt ?? null,
    });
  } catch (error) {
    console.error('GET /orders/:backendOrderId failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch(
  '/orders/:orderId/assign-driver',
  requireSupabaseUser,
  async (req: AuthenticatedRequest & Request<{ orderId: string }, {}, AssignDriverBody>, res) => {
    try {
      const requesterId = req.user!.id;
      const hasRole = await ensureRole(requesterId, 'store_owner');
      if (!hasRole) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const orderId = req.params.orderId?.trim();
      const driverId = req.body.driverId?.trim();

      if (!orderId || !isUuid(orderId)) {
        res.status(400).json({ error: 'Invalid orderId' });
        return;
      }

      if (!driverId || !isUuid(driverId)) {
        res.status(400).json({ error: 'driverId is required and must be a UUID' });
        return;
      }

      const driverProfile = await prisma.profile.findUnique({
        where: { id: driverId },
        select: { role: true },
      });

      if (driverProfile?.role !== 'driver') {
        res.status(400).json({ error: 'driverId does not belong to a driver profile' });
        return;
      }

      const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          fulfillmentStatus: true,
          approvedAt: true,
        },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status !== 'paid') {
        res.status(400).json({ error: 'Order must be paid before assigning a driver' });
        return;
      }

      if (order.fulfillmentStatus === 'delivered') {
        res.status(400).json({ error: 'Delivered orders cannot be reassigned' });
        return;
      }

      const now = new Date();
      const updateData: Prisma.PaymentOrderUpdateInput = {
        fulfillmentStatus: 'assigned',
        driverId,
        assignedAt: now,
      };
      if (!order.approvedAt) {
        updateData.approvedAt = now;
      }

      const updatedOrder = await prisma.paymentOrder.update({
        where: { id: orderId },
        data: updateData,
        select: paymentOrderFulfillmentSelect,
      });

      console.log('[orders] ASSIGNED_DRIVER', { orderId, driverId });
      res.json(updatedOrder);
    } catch (error) {
      console.error('PATCH /orders/:orderId/assign-driver failed', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

app.patch('/orders/:orderId/delivered', requireSupabaseUser, async (req: AuthenticatedRequest & Request<{ orderId: string }>, res) => {
  try {
    const requesterId = req.user!.id;
    const hasRole = await ensureRole(requesterId, 'driver');
    if (!hasRole) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const orderId = req.params.orderId?.trim();
    if (!orderId || !isUuid(orderId)) {
      res.status(400).json({ error: 'Invalid orderId' });
      return;
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        fulfillmentStatus: true,
        driverId: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.driverId !== requesterId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (order.status !== 'paid') {
      res.status(400).json({ error: 'Order must be paid before delivery' });
      return;
    }

    if (order.fulfillmentStatus !== 'assigned') {
      res.status(400).json({ error: 'Order must be assigned before delivery' });
      return;
    }

    const updatedOrder = await prisma.paymentOrder.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: 'delivered',
        deliveredAt: new Date(),
      },
      select: paymentOrderFulfillmentSelect,
    });

    console.log('[orders] MARKED_DELIVERED', { orderId, driverId: requesterId });
    res.json(updatedOrder);
  } catch (error) {
    console.error('PATCH /orders/:orderId/delivered failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/orders/:orderId/accept-driver', requireSupabaseUser, async (req: AuthenticatedRequest & Request<{ orderId: string }>, res) => {
  try {
    const requesterId = req.user!.id;
    const hasRole = await ensureRole(requesterId, 'driver');
    if (!hasRole) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const orderId = req.params.orderId?.trim();
    if (!orderId || !isUuid(orderId)) {
      res.status(400).json({ error: 'Invalid orderId' });
      return;
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        fulfillmentStatus: true,
        driverId: true,
        approvedAt: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status !== 'paid') {
      res.status(400).json({ error: 'Order must be paid before driver acceptance' });
      return;
    }

    if (order.driverId) {
      res.status(400).json({ error: 'Order already has an assigned driver' });
      return;
    }

    if (order.fulfillmentStatus !== 'pending_approval') {
      res.status(400).json({ error: 'Order is not open for driver acceptance' });
      return;
    }

    const now = new Date();
    const updateData: Prisma.PaymentOrderUpdateInput = {
      driverId: requesterId,
      fulfillmentStatus: 'assigned',
      assignedAt: now,
    };
    if (!order.approvedAt) {
      updateData.approvedAt = now;
    }

    const updatedOrder = await prisma.paymentOrder.update({
      where: { id: orderId },
      data: updateData,
      select: paymentOrderFulfillmentSelect,
    });

    console.log('[orders] ACCEPTED_DRIVER', { orderId, driverId: requesterId });
    res.json(updatedOrder);
  } catch (error) {
    console.error('PATCH /orders/:orderId/accept-driver failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhooks/paymongo', async (req, res) => {
  try {
    const signatureHeader = req.get('Paymongo-Signature');
    if (!signatureHeader) {
      console.log('[paymongo-webhook] SKIP invalid_signature', { hasSignature: false });
      return res.sendStatus(400);
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : null;
    if (!rawBody || !verifyPaymongoSignature(signatureHeader, rawBody)) {
      console.log('[paymongo-webhook] SKIP invalid_signature', { hasSignature: true });
      return res.sendStatus(400);
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      console.log('[paymongo-webhook] SKIP invalid_json');
      return res.sendStatus(400);
    }

    const eventId = payload?.data?.id;
    const eventType = payload?.data?.attributes?.type ?? payload?.data?.type ?? 'unknown';
    const livemode = payload?.data?.attributes?.livemode ?? false;
    const eventObject = payload?.data?.attributes?.data;

    console.log('[paymongo-webhook] EVENT', { eventId, eventType });

    if (!eventId) {
      console.log('[paymongo-webhook] SKIP', { eventId: null, reason: 'missing_event_id' });
      return res.sendStatus(200);
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingEvent = await tx.webhookEvent.findUnique({
        where: { eventId },
        select: { id: true },
      });
      if (existingEvent) {
        return { kind: 'skip' as const, reason: 'duplicate_event' as const };
      }

      try {
        await tx.webhookEvent.create({
          data: {
            eventId,
            type: eventType,
            livemode,
            payload,
          },
        });
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          console.log('[paymongo-webhook] SKIP duplicate_event_race', { eventId });
          return { kind: 'skip' as const, reason: 'duplicate_event_race' as const };
        }
        throw error;
      }

      if (eventType === 'checkout_session.payment.paid') {
        const checkoutSessionId = eventObject?.id as string | undefined;
        if (!checkoutSessionId) {
          return {
            kind: 'skip' as const,
            reason: 'missing_checkout_session_id' as const,
          };
        }

        const payment = await tx.paymongoPayment.findUnique({
          where: { checkoutSessionId },
        });

        if (!payment) {
          return {
            kind: 'skip' as const,
            reason: 'payment_not_found' as const,
            checkoutSessionId,
          };
        }

        const order = await tx.paymentOrder.findUnique({
          where: { id: payment.paymentOrderId },
          select: { status: true },
        });

        if (!order) {
          return {
            kind: 'skip' as const,
            reason: 'order_not_found' as const,
            paymentOrderId: payment.paymentOrderId,
            checkoutSessionId,
          };
        }

        if (payment.status === 'paid' || order.status === 'paid') {
          return {
            kind: 'skip' as const,
            reason: 'already_paid' as const,
            paymentOrderId: payment.paymentOrderId,
            checkoutSessionId,
            paymongoPaymentId: payment.paymongoPaymentId ?? undefined,
          };
        }

        const paidAtUnix = eventObject?.attributes?.paid_at;
        const paidAt =
          typeof paidAtUnix === 'number' && Number.isFinite(paidAtUnix)
            ? new Date(paidAtUnix * 1000)
            : new Date();

        const data: Prisma.PaymongoPaymentUpdateInput = {
          status: 'paid',
          paidAt,
        };

        await tx.paymongoPayment.update({
          where: { id: payment.id },
          data,
        });

        await tx.paymentOrder.update({
          where: { id: payment.paymentOrderId },
          data: {
            status: 'paid',
          },
        });

        return {
          kind: 'marked_paid' as const,
          paymentOrderId: payment.paymentOrderId,
          checkoutSessionId,
          paymongoPaymentId: payment.paymongoPaymentId ?? undefined,
        };
      }

      if (eventType === 'payment.paid') {
        const payId = eventObject?.id as string | undefined;
        const backendOrderId = eventObject?.attributes?.metadata?.backendOrderId as string | undefined;
        if (!backendOrderId) {
          return {
            kind: 'skip' as const,
            reason: 'missing_backend_order_id' as const,
            paymongoPaymentId: payId ?? undefined,
          };
        }

        const existingPayment = await tx.paymongoPayment.findUnique({
          where: { paymentOrderId: backendOrderId },
        });
        if (!existingPayment) {
          return {
            kind: 'skip' as const,
            reason: 'payment_not_found' as const,
            paymentOrderId: backendOrderId,
            paymongoPaymentId: payId ?? undefined,
          };
        }

        const order = await tx.paymentOrder.findUnique({
          where: { id: backendOrderId },
          select: { status: true },
        });
        if (!order) {
          return {
            kind: 'skip' as const,
            reason: 'order_not_found' as const,
            paymentOrderId: backendOrderId,
            paymongoPaymentId: payId ?? undefined,
          };
        }

        if (existingPayment.status === 'paid' || order.status === 'paid') {
          return {
            kind: 'skip' as const,
            reason: 'already_paid' as const,
            paymentOrderId: backendOrderId,
            paymongoPaymentId: existingPayment.paymongoPaymentId ?? payId ?? undefined,
          };
        }

        const paidAtUnix = eventObject?.attributes?.paid_at;
        const paidAt =
          typeof paidAtUnix === 'number' && Number.isFinite(paidAtUnix)
            ? new Date(paidAtUnix * 1000)
            : new Date();

        const data: Prisma.PaymongoPaymentUpdateInput = {
          paymongoPaymentId: payId,
          status: 'paid',
          paidAt,
        };

        await tx.paymongoPayment.update({
          where: { paymentOrderId: backendOrderId },
          data,
        });

        await tx.paymentOrder.update({
          where: { id: backendOrderId },
          data: { status: 'paid' },
        });

        return {
          kind: 'marked_paid' as const,
          paymentOrderId: backendOrderId,
          checkoutSessionId: existingPayment.checkoutSessionId,
          paymongoPaymentId: payId ?? existingPayment.paymongoPaymentId ?? undefined,
        };
      }

      return { kind: 'skip' as const, reason: 'unknown_event_type' as const };
    });

    if (result.kind === 'marked_paid') {
      console.log('[paymongo-webhook] MARKED_PAID', {
        eventId,
        paymentOrderId: result.paymentOrderId,
        checkoutSessionId: result.checkoutSessionId,
        paymongoPaymentId: result.paymongoPaymentId,
      });
      return res.sendStatus(200);
    }

    console.log('[paymongo-webhook] SKIP', {
      eventId,
      reason: result.reason,
      paymentOrderId: 'paymentOrderId' in result ? result.paymentOrderId : undefined,
      checkoutSessionId: 'checkoutSessionId' in result ? result.checkoutSessionId : undefined,
    });
    return res.sendStatus(200);
  } catch (err) {
    console.error('[paymongo-webhook] ERROR', err);
    return res.sendStatus(500);
  }
});

const start = async () => {
  await seedProductsIfEmpty();
  app.listen(PORT, () => {
    console.log(`ConstructGo payments backend listening on :${PORT}`);
  });
};

start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
