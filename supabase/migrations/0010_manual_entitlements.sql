-- Manual admin grant/revoke for entitlements — "someone calls, their
-- payment link seemed broken, comp them or record a phone sale so it
-- still balances with the accountant."
--
-- `note` doubles as the free-text detail shown on the account page for
-- the three tiers that don't have a self-serve purchase/registration flow
-- yet (Audit Room / Scoped Engagement / VIP — see Account Area Spec):
-- rather than building three bespoke structured tables (session records,
-- milestones, deliverable links, roster consent, etc.) for tiers with no
-- real buyers yet, the admin who manually grants access writes the
-- relevant details in plain text once, and the account page just displays
-- it under that tier's heading. Worth upgrading to real structured tables
-- once one of these tiers has actual paying clients using it regularly —
-- flagged here so that tradeoff isn't forgotten.
alter table public.entitlements
  add column if not exists status text not null default 'active',
  add column if not exists note text;

comment on column public.entitlements.status is
  'active or revoked. A revoke flips this rather than deleting the row, so manual/Stripe purchase history stays intact for bookkeeping.';
comment on column public.entitlements.note is
  'Free text. For workshop_library, admin/bookkeeping context only (e.g. "Comped — checkout bug"). For audit_room/scoped_engagement/vip, shown to the client on their account page as the tier''s details (session date, deliverable link, engagement status, etc.) until those tiers get real structured data models.';

-- ---------- paid_video_views ----------
-- Flat, factual "viewed / not viewed" tracking for the Workshop Library
-- account module ("6 of 14 sessions viewed") — deliberately not a
-- percent-complete progress bar or anything gamified, just a record of
-- which extended-cut sessions a buyer has actually opened.
create table if not exists public.paid_video_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  paid_video_id uuid not null references public.paid_videos(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, paid_video_id)
);

alter table public.paid_video_views enable row level security;

create policy "paid_video_views_select_own_or_admin"
  on public.paid_video_views for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "paid_video_views_insert_own"
  on public.paid_video_views for insert
  with check (user_id = auth.uid());
