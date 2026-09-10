# Orchemet

Next.js app powering orchemet.com — auth, an admin CMS, and gated purchases
on top of what used to be a single static HTML file. The original design,
copy, and layout are preserved exactly; this is the backend/infrastructure
that was missing.

## Stack

- **Next.js 14** (App Router) on Vercel
- **Supabase** — Auth (email/password, password reset), Postgres + Row Level
  Security for all CMS content, users, and entitlements
- **Stripe** — Payment Links for the two direct-checkout tiers, a verified
  webhook to grant access, and the Customer Portal for any future
  subscription tier

## One-time setup

### 1. Create a new Supabase project

Create it fresh — **do not** reuse the founder's existing Perennial
project. In the new project:

1. **SQL Editor** → run `supabase/migrations/0001_init.sql`. This creates
   every table (`profiles`, `entitlements`, `site_settings`,
   `ladder_tiers`, `videos`, `calendar_sessions`), RLS policies, and seeds
   the current copy/prices/calendar session so the site matches the live
   original the moment it's deployed.
2. **Authentication → Providers**: Email should already be on. Under
   **Authentication → URL Configuration**, set the Site URL to your
   production domain (e.g. `https://orchemet.com`) and add
   `http://localhost:3000` as an additional redirect URL for local dev.
3. **Authentication → Emails**: customize the confirmation/reset templates
   if desired (optional — Supabase's defaults work out of the box).
4. Copy **Project Settings → API**: `Project URL`, `anon public` key, and
   `service_role` key (keep the service role key secret — server only).

### 2. Make yourself an admin

Sign up for an account on the running app once (see below), then in the
Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Every other admin/role change after that can be made from `/admin/users`
in the app itself.

### 3. Stripe

1. Keep using (or recreate) the Workshop Library **Payment Link** ($147,
   one-time). Paste its URL into **Admin → Ladder Tiers → Early Access**.
2. Grab that Payment Link's **Price ID** (`price_...`) from the Stripe
   Dashboard (Product catalog → the $147 price) and set it as
   `STRIPE_PRICE_WORKSHOP_LIBRARY`. The webhook uses it to double check a
   completed checkout really was for this product before granting access.
3. **Developers → Webhooks** → add an endpoint at
   `https://<your-domain>/api/stripe/webhook`, subscribed to
   `checkout.session.completed`. Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.
4. **Settings → Billing → Customer portal**: configure the
   cancellation-reason survey (a few canned reasons + "other" free text) —
   or run `STRIPE_SECRET_KEY=sk_... node scripts/configure-stripe-portal.mjs`
   to create that configuration via the API instead of clicking through
   the dashboard. Nothing today is a subscription, so the portal has
   nothing to cancel yet, but it's wired up (`/api/stripe/portal`) for the
   moment a recurring tier exists.
5. Copy your Stripe **secret key** into `STRIPE_SECRET_KEY`.

### 4. Environment variables

Copy `.env.example` to `.env.local` (and set the same names in Vercel →
Project → Settings → Environment Variables for production/preview):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only — never expose to the client
STRIPE_SECRET_KEY=              # server only
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_WORKSHOP_LIBRARY=
```

### 5. Run it

```
npm install
npm run dev
```

Everything that used to be hardcoded in `CONFIG` now lives in
`/admin` (brand, hero/about copy, the five ladder tiers, the video
library, and the calendar) and in `/admin/users` (roles, blocking, CSV
export).

## How access control works

- **Auth**: 100% Supabase Auth (`supabase.auth.signUp` /
  `signInWithPassword` / `resetPasswordForEmail` / `updateUser`). No
  custom password or OTP logic. Signing up with an already-registered
  email is detected (both the explicit error and Supabase's
  empty-`identities` response used to avoid email enumeration) and shows a
  "reset your password instead?" prompt rather than a confusing error.
- **Admin pages** (`/admin/**`) are gated server-side in
  `src/lib/auth.ts` (`requireAdmin`), which checks `profiles.role`. RLS
  policies on every CMS table independently enforce the same rule at the
  database level (`is_admin(auth.uid())`) — the UI check is not the only
  thing standing between a non-admin and these tables.
- **Workshop Library purchase → access**: the $147 tier's button always
  routes through `/api/checkout/workshop-library`, which sends
  signed-out visitors to sign up first, then redirects to the Stripe
  Payment Link with `client_reference_id` set to their Supabase user id.
  The Stripe webhook (`/api/stripe/webhook`, signature-verified,
  service-role only) is the only thing that ever writes an
  `entitlements` row — there is no client-side "unlocked" flag anywhere.
  `/library` checks that entitlement server-side before rendering
  anything.
- **User management**: `/admin/users` reads `auth.admin.listUsers()` (for
  email/last-login) joined with `profiles` (name/phone/role/blocked/
  marketing) using the service-role client — never exposed to the
  browser. Blocking a user calls `auth.admin.updateUserById(..., {
  ban_duration })`, which actually prevents sign-in, not just a UI flag.

## A judgment call worth knowing about

The original page had one `videos` array feeding a single public
"Workshop Library" section that links out to YouTube — those look like
already-released episodes used as free proof/marketing, distinct from
the $147 "Early Access" tier's promise of workshops *before* they reach
YouTube. Rather than invent a second content model that CONFIG never
had, this build keeps the public homepage section exactly as before
(unchanged design, still public, still linking to YouTube) and adds
`/library` as the actual gated "Early Access" hub — same underlying
`videos` table, entitlement-checked, without the outbound YouTube link.
If the founder wants two distinct video lists (a public teaser reel vs.
a separate early-access set), that's a follow-up: add a `visibility`
enum to `videos` rather than reusing `is_visible` for both purposes.

## Project structure

```
supabase/migrations/0001_init.sql   All tables, RLS policies, seed data
src/lib/supabase/{server,client,admin}.ts   Supabase clients (RLS-scoped vs. service-role)
src/lib/auth.ts                     requireUser() / requireAdmin() page guards
src/lib/site-data.ts                Loads CONFIG-equivalent data + resolves CTA links
src/lib/stripe.ts                   Stripe SDK client
src/lib/admin-users.ts              Merges auth.users + profiles for the admin Users page
src/components/                     Ported landing-page sections (Hero, Ladder, Calendar, …)
src/app/(marketing) page.tsx        The public homepage
src/app/login, signup, forgot-password, reset-password, auth/callback   Auth flows
src/app/account                     Signed-in user's account page (billing portal, sign out)
src/app/library                     Gated Workshop Library view
src/app/admin/**                    Role-gated CMS + user management
src/app/api/stripe/webhook          Verified Stripe webhook → grants entitlements
src/app/api/stripe/portal           Creates a Stripe Billing Portal session
src/app/api/checkout/workshop-library   Login-aware redirect into the $147 Payment Link
src/app/api/admin/users/**          Role toggle / block toggle / CSV export
```
