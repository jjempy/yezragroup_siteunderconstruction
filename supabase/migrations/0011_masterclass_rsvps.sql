-- Masterclass RSVPs — the free public calendar sessions had no actual
-- signup capture (just informational cards: topic/date/location). With a
-- real event a week out, "Reserve a Free Seat" needed to mean something.
create table if not exists public.masterclass_rsvps (
  id uuid primary key default gen_random_uuid(),
  calendar_session_id uuid not null references public.calendar_sessions(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  created_at timestamptz not null default now(),
  unique (calendar_session_id, email)
);

alter table public.masterclass_rsvps enable row level security;

-- Anyone can RSVP — it's a public, no-login-required form, same posture
-- as newsletter_signups.
create policy "masterclass_rsvps_insert_anyone"
  on public.masterclass_rsvps for insert
  with check (true);

create policy "masterclass_rsvps_select_admin"
  on public.masterclass_rsvps for select
  using (public.is_admin(auth.uid()));
