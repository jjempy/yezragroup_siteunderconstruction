-- ============================================================
-- Orchemet — initial schema
-- Auth is handled entirely by Supabase Auth (auth.users). This
-- migration adds: a profile per user (role/blocked/marketing),
-- entitlements (purchase records), and the CMS-editable content
-- that used to live in the static CONFIG object.
-- ============================================================

-- ---------- profiles ----------
-- Created before is_admin() below, which references this table — SQL-
-- language functions are validated against existing objects at creation
-- time, so the table has to exist first.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'standard' check (role in ('standard', 'admin')),
  blocked boolean not null default false,
  marketing_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- helper: is_admin() ----------
-- security definer so it can read profiles regardless of the caller's
-- own row visibility, without causing recursive RLS evaluation.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = uid),
    false
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.is_admin(auth.uid()));

-- Defense in depth: even if a policy or client bug lets a non-admin
-- reach this row, they can never move their own role/blocked flag.
create or replace function public.enforce_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.role := old.role;
    new.blocked := old.blocked;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_self_update on public.profiles;
create trigger trg_enforce_profile_self_update
  before update on public.profiles
  for each row execute function public.enforce_profile_self_update();

-- Auto-create a profile row when someone signs up. full_name/phone come
-- from the metadata passed to supabase.auth.signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, marketing_opt_in)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- entitlements ----------
-- One row per (user, product) they've been granted access to.
-- Written ONLY by the service role from the verified Stripe webhook —
-- there is deliberately no insert/update policy for authenticated/anon.
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null default 'workshop_library',
  stripe_checkout_session_id text,
  stripe_customer_id text,
  granted_at timestamptz not null default now(),
  source text not null default 'stripe_webhook',
  unique (user_id, product)
);

alter table public.entitlements enable row level security;

create policy "entitlements_select_own_or_admin"
  on public.entitlements for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ---------- site_settings (singleton) ----------
create table if not exists public.site_settings (
  id text primary key default 'default',
  brand_name text not null default 'Orchemet',
  logo_url text not null default '',
  color_gold text not null default '',
  color_gold_deep text not null default '',
  color_ink text not null default '',
  color_cream text not null default '',
  heading_font text not null default '',
  body_font text not null default '',
  founder_photo_url text not null default '',
  ga4_measurement_id text not null default '',
  youtube_channel_url text not null default '',
  spotify_url text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  vip_application_url text not null default '',
  scoped_engagement_url text not null default '',
  stripe_workshop_library_url text not null default '',
  stripe_group_masterclass_url text not null default '',
  hero_eyebrow text not null default 'Testimony, Not Theory',
  hero_heading text not null default 'Clarity for the business you''re *actually* running — not the one you keep telling people about.',
  hero_lede text not null default 'Free public masterclasses, hands-on workshops, and private engagements — built on one idea: the biggest risk to a growing business usually isn''t what you don''t know. It''s what nobody around you will say out loud.',
  about_body jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, about_body)
values (
  'default',
  '[
    "Fifteen years in precision manufacturing engineering, state-licensed in insurance, and self-taught in building working AI systems — that''s an unusual stack, and it''s the whole point.",
    "I spent those years building things other people trusted to be right the first time — tooling, training manuals, vendor systems where a small mistake got expensive fast. When I started building AI tools, it wasn''t to keep up with a trend. I built them to catch my own blind spots first, before I ever thought about teaching anyone else to do the same.",
    "Faith and stewardship shape how decisions get made here — not as a slogan, but as the actual filter."
  ]'::jsonb
)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "site_settings_select_all"
  on public.site_settings for select
  using (true);

create policy "site_settings_admin_write"
  on public.site_settings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------- ladder_tiers ----------
-- The five rungs (Masterclass, Workshop Library, Audit Room, Scoped
-- Engagement, VIP). slug is a stable key the app code matches against;
-- admins can edit copy/price/link/visibility but not add arbitrary new
-- rungs from the UI in this phase (the layout is designed for five).
create table if not exists public.ladder_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort_order int not null default 0,
  title text not null default '',
  description text not null default '',
  price_label text not null default '',
  price_sub_label text not null default '',
  cta_label text not null default '',
  cta_href text not null default '',
  is_visible boolean not null default true,
  is_top boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.ladder_tiers enable row level security;

create policy "ladder_tiers_select_visible_or_admin"
  on public.ladder_tiers for select
  using (is_visible or public.is_admin(auth.uid()));

create policy "ladder_tiers_admin_write"
  on public.ladder_tiers for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.ladder_tiers (slug, sort_order, title, description, price_label, price_sub_label, cta_label, cta_href, is_top)
values
  ('masterclass', 1, 'Free Masterclass',
   'A live, in-person session. 20 minutes of real content, the rest spent building something together — and a clear next step at the end, if it''s right for you.',
   'Free', 'In Person', 'See Dates', '#calendar', false),
  ('workshop_library', 2, 'Early Access',
   'Every masterclass and workshop, uncut and organized, yours before any of it reaches YouTube — plus the worksheets that go with each one. This is recorded content, not access to me directly. No Q&A, no correspondence.',
   '$147', 'Full Access', 'Get Access', '', false),
  ('audit_room', 3, 'The Audit Room',
   'You already have the audit — you got it free. This is where you actually finish it: live, on your real business, with nine other owners who have no reason to let you avoid your own answer. Not more to watch — one live room, once a month, capped at ten.',
   '$497', 'Per Seat', 'Claim Your Seat', '', false),
  ('scoped_engagement', 4, 'Scoped Engagement',
   'A defined project, a defined outcome, a one-page scope before we start. This is advisory work — strategy, systems, and training your team to run it themselves. I''m not writing your code or running your floor; I''m making sure you and your people know exactly how to. Built for one business at a time, and priced for problems that are actually worth solving this way.',
   'From $25,000', 'Per Project', 'Start a Conversation', '', false),
  ('vip', 5, 'The VIP Intensive',
   'A private day. One-on-one, start to finish, plus a recorded conversation for your own audience. By application only.',
   'By Application', '3-Hour Day', 'Apply', '', true)
on conflict (slug) do nothing;

-- ---------- videos (Workshop Library) ----------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  title text not null,
  youtube_id text not null,
  duration text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "videos_select_visible_or_admin"
  on public.videos for select
  using (is_visible or public.is_admin(auth.uid()));

create policy "videos_admin_write"
  on public.videos for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------- calendar_sessions (masterclass calendar) ----------
create table if not exists public.calendar_sessions (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  label text not null,
  topic text not null,
  location text not null default '',
  date_text text not null default '',
  status text not null default 'Open',
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.calendar_sessions enable row level security;

create policy "calendar_select_visible_or_admin"
  on public.calendar_sessions for select
  using (is_visible or public.is_admin(auth.uid()));

create policy "calendar_admin_write"
  on public.calendar_sessions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.calendar_sessions (sort_order, label, topic, location, date_text, status)
values (
  1,
  'September 2026',
  'The 5 Blind Spots That Are Quietly Costing You the Business You''re Building',
  'Ashley River Library, Dorchester County',
  'Sept 21, 10:00 AM – 12:00 PM',
  'Open'
)
on conflict do nothing;
