-- The website's nav icon (logo_url) is a small square mark — fine for a
-- 28px tab-bar-sized spot, but too plain for an email header. This lets
-- an admin use a different, larger lockup (e.g. the one already used on
-- business cards/flyers, tagline included) specifically for email.
-- Falls back to logo_url when unset — see getEmailBranding() in email.ts.
alter table public.site_settings
  add column if not exists email_logo_url text not null default '';
