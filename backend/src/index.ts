import crypto from 'node:crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT ?? 4000);
const DEMO_API_KEY = process.env.DEMO_API_KEY ?? '';
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY ?? '';
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET ?? '';
const PAYMONGO_SUCCESS_URL = process.env.PAYMONGO_SUCCESS_URL ?? 'https://example.com/success';
const PAYMONGO_CANCEL_URL = process.env.PAYMONGO_CANCEL_URL ?? 'https://example.com/cancel';
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

if (!DEMO_API_KEY) {
  throw new Error('Missing DEMO_API_KEY');
}
if (!PAYMONGO_SECRET_KEY) {
  throw new Error('Missing PAYMONGO_SECRET_KEY');
}
if (!PAYMONGO_WEBHOOK_SECRET) {
  throw new Error('Missing PAYMONGO_WEBHOOK_SECRET');
}

app.use('/webhooks/paymongo', express.raw({ type: 'application/json' }));
app.use(express.json());

type DemoAuthedRequest = Request & { rawBody?: Buffer };

type CheckoutBody = {
  localOrderId?: string;
  localOrderCode?: string;
  amountCents?: number;
};

const requireDemoAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || token !== DEMO_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
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

app.post('/payments/checkout', requireDemoAuth, async (req: Request<{}, {}, CheckoutBody>, res) => {
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

app.get('/orders/:backendOrderId', requireDemoAuth, async (req, res) => {
  try {
    const backendOrderId = req.params.backendOrderId;

    const order = await prisma.paymentOrder.findUnique({
      where: { id: backendOrderId },
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

app.post('/webhooks/paymongo', async (req: DemoAuthedRequest, res) => {
  try {
    const signatureHeader = req.header('paymongo-signature') ?? req.header('Paymongo-Signature');
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));

    if (!signatureHeader || !verifyPaymongoSignature(signatureHeader, rawBody)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const { eventId, type, livemode, resource } = getEventCore(payload);

    if (!eventId || !type) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    const backendOrderId = extractBackendOrderId(resource);
    const checkoutSessionId = extractCheckoutSessionId(resource);
    const paymongoPaymentId = extractPaymongoPaymentId(resource);
    const loweredType = type.toLowerCase();
    const isPaid = loweredType.includes('paid');
    const isFailed = loweredType.includes('failed') || loweredType.includes('expired') || loweredType.includes('cancel');
    const result = await prisma.$transaction(async (tx) => {
      try {
        await tx.webhookEvent.create({
          data: {
            eventId,
            type,
            livemode,
            payload,
          },
        });
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          return { deduped: true as const };
        }
        throw error;
      }

      let paymentOrderId: string | null = backendOrderId;

      if (!paymentOrderId && checkoutSessionId) {
        const payment = await tx.paymongoPayment.findUnique({ where: { checkoutSessionId } });
        paymentOrderId = payment?.paymentOrderId ?? null;
      }

      if (!paymentOrderId) {
        return { ignored: true as const, reason: 'No matching payment order' as const };
      }

      const currentOrder = await tx.paymentOrder.findUnique({ where: { id: paymentOrderId } });
      if (!currentOrder) {
        return { ignored: true as const, reason: 'Payment order not found' as const };
      }

      const orderAlreadyPaid = currentOrder.status === 'paid';

      if (isPaid) {
        await tx.paymentOrder.update({
          where: { id: paymentOrderId },
          data: { status: 'paid' },
        });
        await tx.paymongoPayment.update({
          where: { paymentOrderId },
          data: {
            status: 'paid',
            paidAt: new Date(),
            paymongoPaymentId: paymongoPaymentId ?? undefined,
          },
        });
      } else if (isFailed && !orderAlreadyPaid) {
        await tx.paymentOrder.update({
          where: { id: paymentOrderId },
          data: { status: 'failed' },
        });
        await tx.paymongoPayment.update({
          where: { paymentOrderId },
          data: {
            status: 'failed',
            paymongoPaymentId: paymongoPaymentId ?? undefined,
          },
        });
      }

      return { ok: true as const };
    });

    if (result.deduped) {
      res.json({ ok: true, deduped: true });
      return;
    }
    if (result.ignored) {
      res.json({ ok: true, ignored: true, reason: result.reason });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('POST /webhooks/paymongo failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`ConstructGo payments backend listening on :${PORT}`);
});
