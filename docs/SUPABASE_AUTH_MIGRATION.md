# Supabase Auth Migration (Incremental)

This document describes the incremental migration from local-only Zustand auth to Supabase Auth while preserving existing role/navigation fallbacks.

## 1) Environment Setup

### Mobile
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL`
- Optional fallback: `EXPO_PUBLIC_DEMO_API_KEY` (dev only)

### Backend (`backend/.env`)
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYMONGO_SECRET_KEY`
- `PAYMONGO_WEBHOOK_SECRET`

## 2) Database SQL (Profiles + RLS)

Run this in Supabase SQL editor:

```sql
-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('customer','driver','store_owner','admin')),
  created_at timestamptz not null default now()
);

-- Add user scope to payment orders
alter table if exists public.payment_orders
  add column if not exists user_id uuid;

create index if not exists idx_payment_orders_user_id
  on public.payment_orders(user_id);

-- RLS enable
alter table public.profiles enable row level security;
alter table public.payment_orders enable row level security;
alter table public.paymongo_payments enable row level security;

-- Profiles policies
create policy if not exists "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy if not exists "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy if not exists "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

-- Payment order policy (owner can read own rows)
create policy if not exists "payment_orders_select_own"
on public.payment_orders for select
using (user_id = auth.uid());

-- Paymongo payment policy via parent ownership
create policy if not exists "paymongo_payments_select_own"
on public.paymongo_payments for select
using (
  exists (
    select 1
    from public.payment_orders po
    where po.id = paymongo_payments.payment_order_id
      and po.user_id = auth.uid()
  )
);
```

## 3) Role Assignment Strategy

Current strategy:
- On successful Supabase sign-in/sign-up in mobile, app upserts profile row with chosen role.
- Root navigator loads profile role from Supabase session and uses it for role gating.
- If Supabase session is absent, app falls back to existing local Zustand auth stores.

## 4) Backend Auth Behavior

- Protected endpoints (`/payments/checkout`, `/orders/:backendOrderId`) require Supabase JWT.
- Backend verifies token using Supabase Auth `/auth/v1/user` endpoint.
- `payment_orders.user_id` is set from verified user id.
- `/orders/:backendOrderId` returns only rows owned by requesting user.
- Webhook endpoint remains unauthenticated but signature-verified.

## 5) Role Testing Checklist

1. Sign in as customer via Supabase screen.
2. Confirm `profiles.role = 'customer'` and customer tab flow works.
3. Place payment; backend accepts JWT and writes `payment_orders.user_id`.
4. Switch role and sign in as store owner/admin via their sign-in screens.
5. Confirm profile role updates and role-based tabs open.
6. Sign out completely; verify local fallback still works when no Supabase session.

## 6) Rollback / Fallback Notes

- Existing local auth stores are still active and used when Supabase session is missing.
- To rollback quickly:
  - remove Supabase env vars from mobile/backend
  - keep local auth flows as primary (already preserved)
- Payments fallback token (`EXPO_PUBLIC_DEMO_API_KEY`) can still be used in dev if backend temporarily supports it.
