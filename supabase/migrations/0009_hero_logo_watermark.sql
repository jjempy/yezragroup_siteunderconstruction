-- The uploaded logo is a detailed, non-transparent icon — good as a small
-- nav mark, but forcing it to also render as a giant hero background
-- watermark (the previous behavior) produced a hard white box and buried
-- the headline. That mapping doesn't generalize to arbitrary logos, so
-- it's now an explicit, off-by-default opt-in instead of automatic.
alter table public.site_settings
  add column if not exists hero_logo_watermark boolean not null default false;

comment on column public.site_settings.hero_logo_watermark is
  'If true, the hero section''s decorative background mark uses the uploaded logo instead of the default abstract two-circle mark. Works best with a transparent PNG/SVG — a logo with a solid background will show as a hard box.';
