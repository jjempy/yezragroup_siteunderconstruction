-- Heading/body fonts were Google-Fonts-only (a text field feeding a
-- fonts.googleapis.com URL) — fine for Montserrat, but the designer's
-- heading font pick (Upbolters New) isn't on Google Fonts at all, just
-- sold as a font file. This lets an admin upload one directly instead.
alter table public.site_settings
  add column if not exists heading_font_file_url text not null default '';
