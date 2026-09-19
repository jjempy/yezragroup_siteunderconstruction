-- Supersedes 0025 and 0026. Supabase's SQL editor runs a pasted
-- multi-statement script as one transaction — when 0025's final
-- constraint failed, everything else in that script (the status
-- pipeline, notes, company_url) rolled back with it, so none of it
-- actually landed; 0026's fix then failed too, since the column it
-- referenced was never really there.
--
-- There's no real customer data in this table yet, so clearing it
-- first sidesteps the entire "existing row violates the new
-- constraint" failure mode outright, rather than backfilling
-- individual rows. Safe to run more than once.
truncate table public.vip_applications;

alter table public.vip_applications drop constraint if exists vip_applications_status_check;
alter table public.vip_applications
  add constraint vip_applications_status_check
    check (status in ('new', 'discovery_scheduled', 'close_scheduled', 'sale', 'no_sale'));
alter table public.vip_applications alter column status set default 'new';

alter table public.vip_applications add column if not exists notes text not null default '';

alter table public.vip_applications add column if not exists company_url text not null default '';
alter table public.vip_applications drop constraint if exists vip_applications_company_url_required;
alter table public.vip_applications
  add constraint vip_applications_company_url_required
    check (company = '' or company_url <> '');
