-- Follow-up refinements to vip_applications (0023):
--   - Phone becomes required (was optional).
--   - An annual-revenue band helps qualify applicants without asking
--     for exact figures.
--   - "Referred by someone" needs a name attached to actually be useful
--     — that option alone isn't more informative than "Other".

-- Phone: drop the '' default (matches name/email, which never had one)
-- and add a check so an empty string can't sneak past a client that
-- skips the form's own `required` attribute.
alter table public.vip_applications
  alter column phone drop default;

alter table public.vip_applications
  add constraint vip_applications_phone_required check (phone <> '');

-- Annual revenue band. Added NOT NULL with a temporary default so this
-- doesn't fail against any rows that already exist, then the default is
-- dropped so every future insert has to pick one explicitly.
alter table public.vip_applications
  add column if not exists annual_revenue text not null default 'under_500k'
    check (annual_revenue in ('under_500k', '500k_1m', '1m_3m', '3m_5m', '5m_10m', 'over_10m'));

alter table public.vip_applications
  alter column annual_revenue drop default;

-- Who referred them — only meaningful (and only required) when
-- referral_source = 'referred'. Empty string is fine for every other
-- referral_source; the check constraint is what actually enforces
-- "required" for this one case.
alter table public.vip_applications
  add column if not exists referred_by text not null default '';

alter table public.vip_applications
  add constraint vip_applications_referred_by_required
    check (referral_source <> 'referred' or referred_by <> '');
