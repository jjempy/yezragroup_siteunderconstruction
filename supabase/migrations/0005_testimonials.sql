-- The "What Happens in the Room" testimonial cards were hardcoded
-- placeholder text with no CMS field at all — not editable from admin.
-- This adds a real table for them, following the same add/edit/reorder/
-- remove + hide-if-empty pattern as videos and calendar_sessions.
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  quote text not null default '',
  name text not null default '',
  title text not null default '',
  company text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "testimonials_select_visible_or_admin"
  on public.testimonials for select
  using (is_visible or public.is_admin(auth.uid()));

create policy "testimonials_admin_write"
  on public.testimonials for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
