-- VIP applications, in-house. The "Request an Application" / "Apply for
-- VIP" buttons used to point at an external Tally/Google Form URL
-- (site_settings.vip_application_url) — when that field was never set,
-- resolveTierHref() fell back to '#', which just re-anchors the same
-- homepage instead of going anywhere, reading as a broken looping link.
-- This table + the /apply-vip form replace that dependency entirely:
-- applications land in our own database (reportable in Analytics/People
-- later) instead of an opaque third-party tool, and referral_source
-- gives the "most applicants are referred..." homepage claim something
-- real to eventually be measured against instead of asserted.
create table if not exists public.vip_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  company text not null default '',
  message text not null,
  referral_source text not null default 'other'
    check (referral_source in ('scoped_engagement', 'masterclass', 'referred', 'other')),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.vip_applications enable row level security;

-- Same posture as contact_messages/masterclass_rsvps: anyone can submit
-- (it's a public, no-login form), only admins can read submissions back.
create policy "vip_applications_insert_anyone"
  on public.vip_applications for insert
  with check (true);

create policy "vip_applications_select_admin"
  on public.vip_applications for select
  using (public.is_admin(auth.uid()));

create policy "vip_applications_update_admin"
  on public.vip_applications for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
