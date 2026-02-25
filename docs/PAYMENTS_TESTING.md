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
- `SUPABASE_URL` = Supabase project URL
- `SUPABASE_ANON_KEY` = Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key (system/server usage)
- `PAYMONGO_SECRET_KEY` = PayMongo test secret key
- `PAYMONGO_WEBHOOK_SECRET` = PayMongo webhook secret
- `PAYMONGO_SUCCESS_URL` = redirect URL after success (test placeholder is fine)
- `PAYMONGO_CANCEL_URL` = redirect URL after cancel
- `PORT` = backend port (default `4000`)

### Mobile (`.env` for Expo)
- `EXPO_PUBLIC_API_BASE_URL` = backend base URL (example: `http://192.168.1.5:4000`)
- `EXPO_PUBLIC_SUPABASE_URL` = Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
- `EXPO_PUBLIC_DEMO_API_KEY` = optional dev fallback only (used only when no Supabase token)

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
3. Ensure user is authenticated with Supabase (token attached by mobile API client).
4. App creates local order + calls backend `/payments/checkout`.
5. Backend creates PayMongo Checkout Session and returns URL.
6. App opens checkout URL.
7. Complete payment in PayMongo test flow.
8. Webhook updates DB status to `paid`.
9. App polling sees `paid` and continues existing order flow.

## 6) Troubleshooting
- `401 Unauthorized` from backend:
  - Ensure the mobile session has a valid Supabase access token.
  - Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in backend env.
- Polling remains `pending`:
  - Verify webhook URL points to current ngrok URL.
  - Verify webhook secret matches backend env.
- Signature verification fails:
  - Ensure backend uses **raw body** for `/webhooks/paymongo`.
  - Do not JSON-parse before signature verification.
- Payment amount mismatch:
  - App sends pesos, backend must use centavos integer (`round(pesos * 100)`).
  - Minimum demo amount enforced to `2000` cents (PHP 20).
- Stuck `pending` after webhook:
  - Webhook processing must be atomic: `webhook_events` insert and payment status updates are committed in one DB transaction.
  - This prevents partial writes where an event is marked processed but status is never updated.

## 7) Mobile Behavior
- Checkout still polls for up to 120 seconds after opening checkout URL.
- `OrderStatusScreen` performs a one-time refresh on mount for non-COD orders with `paymentStatus = pending`.
- If backend already marked `paid`/`failed`, the local badge updates automatically.

## 8) Auth & RLS Note
- Protected payment endpoints now require a Supabase JWT.
- Backend verifies JWT by calling Supabase Auth user endpoint.
- `payment_orders` rows are user-scoped (`user_id`) and reads are restricted to owner.
- Keep PayMongo secret/webhook logic backend-only.
