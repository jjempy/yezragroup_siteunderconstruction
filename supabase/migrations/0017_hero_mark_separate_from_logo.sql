-- The hero's decorative background mark was a checkbox that reused the
-- nav/footer logo_url — but the logo (a small icon) and a large faded
-- hero background element are genuinely different images with different
-- requirements (a logo needs to read crisp and small; a hero background
-- mark needs to read soft and huge). Splitting them into two fully
-- independent images, each with its own opacity control.
--
-- hero_logo_watermark (0009 migration) is superseded by this and no
-- longer read by the app — left in place rather than dropped since
-- dropping a column is destructive and there's no benefit to removing it
-- over just ignoring it.
alter table public.site_settings
  add column if not exists hero_mark_url text not null default '',
  add column if not exists hero_mark_opacity integer not null default 35;

comment on column public.site_settings.hero_mark_url is
  'Independent image for the large faded decorative mark behind the homepage headline. Empty = falls back to the default abstract two-circle mark. Not tied to logo_url.';
comment on column public.site_settings.hero_mark_opacity is
  'Opacity (0-100) applied to hero_mark_url (or the default mark if that''s empty).';
