# PayMongo Test Payments Setup (GCash + Maya)

This guide sets up **test-mode payments** for ConstructGo using a backend service.

## 1) Architecture
- Mobile app never calls PayMongo directly.
- Backend calls PayMongo using secret keys.
- Mobile receives a `checkoutUrl` and opens it.
- PayMongo webhook updates DB payment status (`paid`/`failed`).
- Mobile polls backend order status until confirmed.

## 2) Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` = Supabase Postgres connection string
- `DEMO_API_KEY` = shared demo bearer key
- `PAYMONGO_SECRET_KEY` = PayMongo test secret key
- `PAYMONGO_WEBHOOK_SECRET` = PayMongo webhook secret
- `PAYMONGO_SUCCESS_URL` = redirect URL after success (test placeholder is fine)
- `PAYMONGO_CANCEL_URL` = redirect URL after cancel
- `PORT` = backend port (default `4000`)

### Mobile (`.env` for Expo)
- `EXPO_PUBLIC_API_BASE_URL` = backend base URL (example: `http://192.168.1.5:4000`)
- `EXPO_PUBLIC_DEMO_API_KEY` = same value as backend `DEMO_API_KEY`

## 3) Local Run Commands

### Backend
1. `npm run backend:install`
2. `npm run backend:prisma:generate`
3. `npm run backend:prisma:migrate`
4. `npm run backend:dev`

### Mobile
1. `npm install`
2. `npx expo start -c`

## 4) ngrok + Webhook Setup (PayMongo)
1. Start backend locally on `:4000`.
2. Expose it: `ngrok http 4000`
3. Copy public URL (example: `https://xxxx.ngrok-free.app`)
4. In PayMongo dashboard, create webhook endpoint:
   - URL: `https://xxxx.ngrok-free.app/webhooks/paymongo`
   - Use test mode events for checkout payment success/failure
5. Copy generated webhook secret and set `PAYMONGO_WEBHOOK_SECRET`.
6. Restart backend.

## 5) Test Flow
1. Customer proceeds to Checkout.
2. Select `Pay with GCash` or `Pay with Maya`.
3. App creates local order + calls backend `/payments/checkout`.
4. Backend creates PayMongo Checkout Session and returns URL.
5. App opens checkout URL.
6. Complete payment in PayMongo test flow.
7. Webhook updates DB status to `paid`.
8. App polling sees `paid` and continues existing order flow.

## 6) Troubleshooting
- `401 Unauthorized` from backend:
  - Check `EXPO_PUBLIC_DEMO_API_KEY` matches backend `DEMO_API_KEY`.
- Polling remains `pending`:
  - Verify webhook URL points to current ngrok URL.
  - Verify webhook secret matches backend env.
- Signature verification fails:
  - Ensure backend uses **raw body** for `/webhooks/paymongo`.
  - Do not JSON-parse before signature verification.
- Payment amount mismatch:
  - App sends pesos, backend must use centavos integer (`round(pesos * 100)`).
  - Minimum demo amount enforced to `2000` cents (PHP 20).

## 7) Migration Note (Later: Replace DEMO_API_KEY)
Current demo auth uses a shared API key. For production-ready security:
- Replace demo bearer key with Supabase Auth JWT verification on backend.
- Validate user identity + role per request.
- Add row-level authorization policies (RLS) in Supabase.
- Keep PayMongo secret/webhook logic backend-only.
