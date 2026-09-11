-- Corrects the content model: the existing `videos` table is the
-- always-free, publicly-released masterclass recap episodes (unchanged,
-- never gated). The paid "Early Access" $147 tier is actually a SEPARATE,
-- longer/less-edited bonus cut of each session with additional insights —
-- not just a restricted view of the free episodes. This table holds that
-- paid-only content; non-buyers get a short clipped preview
-- (preview_seconds) of THIS content, not of the free videos.
create table if not exists public.paid_videos (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  title text not null,
  youtube_id text not null,
  duration text not null default '',
  preview_seconds integer not null default 45,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.paid_videos enable row level security;

create policy "paid_videos_select_visible_or_admin"
  on public.paid_videos for select
  using (is_visible or public.is_admin(auth.uid()));

create policy "paid_videos_admin_write"
  on public.paid_videos for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
