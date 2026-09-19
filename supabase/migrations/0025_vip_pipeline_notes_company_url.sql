-- VIP Applications, round 3:
--   - Replaces the generic new/reviewed/resolved placeholder status
--     with a real sales pipeline (New, Discovery Call Scheduled, Close
--     Call Scheduled, Sale, No Sale) — this table stands in for a real
--     CRM (Airtable) until that's set up, and needs to actually track
--     where a deal is.
--   - Adds a running internal notes field (plain text, no length limit)
--     for the same reason.
--   - If a company name is given, a website for it is now required —
--     same "conditionally required" pattern as referred_by (0024).

-- Reasonable defaults for the handful of rows that predate this
-- pipeline: still-open ('reviewed') becomes 'new' (back in the active
-- pipeline), closed-out ('resolved') becomes 'no_sale'.
update public.vip_applications set status = 'new' where status = 'reviewed';
update public.vip_applications set status = 'no_sale' where status = 'resolved';

alter table public.vip_applications drop constraint if exists vip_applications_status_check;
alter table public.vip_applications
  add constraint vip_applications_status_check
    check (status in ('new', 'discovery_scheduled', 'close_scheduled', 'sale', 'no_sale'));
alter table public.vip_applications alter column status set default 'new';

-- Running internal notes — free text, no character limit (Postgres
-- `text` has none), meant to be appended to by hand over time.
alter table public.vip_applications add column if not exists notes text not null default '';

-- Company website, required only when a company name is given.
alter table public.vip_applications add column if not exists company_url text not null default '';
alter table public.vip_applications
  add constraint vip_applications_company_url_required
    check (company = '' or company_url <> '');
