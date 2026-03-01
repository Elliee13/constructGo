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

app.use(express.json());
app.use(productsRouter);

type DemoAuthedRequest = Request & { rawBody?: Buffer };

type CheckoutBody = {
  localOrderId?: string;
  localOrderCode?: string;
  amountCents?: number;
};

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

app.post('/webhooks/paymongo', async (req, res) => {
  try {
    console.log('[paymongo-webhook] HIT');

    const payload = req.body;

    const eventId = payload?.data?.id;
    const eventType = payload?.data?.attributes?.type ?? payload?.data?.type ?? 'unknown';
    const livemode = payload?.data?.attributes?.livemode ?? false;
    const eventObject = payload?.data?.attributes?.data;

    console.log('[paymongo-webhook] EVENT', { eventId, eventType });

    if (!eventId) {
      console.error('[paymongo-webhook] Missing eventId');
      return res.sendStatus(400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.webhookEvent.upsert({
        where: { eventId },
        update: {},
        create: {
          eventId,
          type: eventType,
          livemode,
          payload,
        },
      });

      if (eventType === 'checkout_session.payment.paid') {
        const checkoutSessionId = eventObject?.id as string | undefined;
        if (!checkoutSessionId) return;

        const payment = await tx.paymongoPayment.findUnique({
          where: { checkoutSessionId },
        });

        if (!payment) {
          console.warn('[paymongo-webhook] Payment not found for session:', checkoutSessionId);
          return;
        }

        const paidAtUnix = eventObject?.attributes?.paid_at;
        const paidAt =
          typeof paidAtUnix === 'number' && Number.isFinite(paidAtUnix)
            ? new Date(paidAtUnix * 1000)
            : new Date();

        await tx.paymongoPayment.update({
          where: { id: payment.id },
          data: {
            status: 'paid',
            paidAt,
          },
        });

        await tx.paymentOrder.update({
          where: { id: payment.paymentOrderId },
          data: {
            status: 'paid',
          },
        });

        console.log('[paymongo-webhook] Payment + order marked as paid');
      }

      if (eventType === 'payment.paid') {
        const payId = eventObject?.id as string | undefined;
        const backendOrderId = eventObject?.attributes?.metadata?.backendOrderId as string | undefined;
        if (!backendOrderId) return;

        const paidAtUnix = eventObject?.attributes?.paid_at;
        const paidAt =
          typeof paidAtUnix === 'number' && Number.isFinite(paidAtUnix)
            ? new Date(paidAtUnix * 1000)
            : new Date();

        await tx.paymongoPayment.update({
          where: { paymentOrderId: backendOrderId },
          data: {
            paymongoPaymentId: payId,
            status: 'paid',
            paidAt,
          },
        });

        await tx.paymentOrder.update({
          where: { id: backendOrderId },
          data: { status: 'paid' },
        });

        console.log('[paymongo-webhook] Payment + order marked as paid');
      }
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
