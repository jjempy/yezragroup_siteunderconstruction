-- Two small, additive columns supporting:
--  1) An agenda-style admin Calendar view that can actually group sessions
--     into Past / Today / Upcoming (the existing `date_text` is free-form
--     display text like "Sept 21, 10:00 AM – 12:00 PM" and can't be sorted
--     or compared to "today" reliably).
--  2) A basic order-history list on the account page, showing what was
--     paid and when (captured from the Stripe checkout session at the
--     moment the webhook grants the entitlement).
--
-- Both are nullable/optional and don't change any existing behavior —
-- date_text keeps being the public-facing display string on the homepage
-- calendar; session_date is purely an admin-side sorting/tracking aid.

alter table public.calendar_sessions
  add column if not exists session_date date;

comment on column public.calendar_sessions.session_date is
  'Actual calendar date used only for admin agenda grouping (Past/Today/Upcoming). The public site keeps showing date_text as-is.';

alter table public.entitlements
  add column if not exists amount_total integer,
  add column if not exists currency text;

comment on column public.entitlements.amount_total is
  'Amount paid, in the smallest currency unit (e.g. cents), captured from the Stripe checkout session. Null for entitlements granted some other way.';
comment on column public.entitlements.currency is
  'ISO currency code (e.g. usd) matching amount_total.';
