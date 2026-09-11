-- Adds a per-video preview length so non-buyers can see a short "hook"
-- clip of each episode (via YouTube's start/end embed params) instead of
-- an all-or-nothing paywall — supports the "let them see what they're
-- missing" model rather than blocking the whole library.
alter table public.videos
  add column if not exists preview_seconds integer not null default 45;
