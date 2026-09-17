-- Contact form — the footer's "Connect" section used to show a raw
-- mailto link straight to Joseph's inbox. This gives visitors a real form
-- instead (account access, purchase issues, masterclass scheduling
-- questions, general questions) and keeps the actual address out of the
-- page source, while still landing in an inbox (via Resend) and staying
-- queryable here for a team to triage later.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  reason text not null default 'general',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone can submit — it's a public, no-login-required form, same posture
-- as newsletter_signups and masterclass_rsvps.
create policy "contact_messages_insert_anyone"
  on public.contact_messages for insert
  with check (true);

create policy "contact_messages_select_admin"
  on public.contact_messages for select
  using (public.is_admin(auth.uid()));

create policy "contact_messages_update_admin"
  on public.contact_messages for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
