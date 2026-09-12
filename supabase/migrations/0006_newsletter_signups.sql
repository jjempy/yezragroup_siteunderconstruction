-- Lean, temporary email capture — meant to be replaced by a real ESP
-- (Beehiiv) later. Deliberately minimal: just enough to not lose an
-- email someone actually gives us, plus a CSV export to migrate off this
-- table whenever a real ESP account exists. No unsubscribe flow, no
-- double opt-in, no sending capability — none of that belongs here.
create table if not exists public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'homepage',
  created_at timestamptz not null default now()
);

alter table public.newsletter_signups enable row level security;

-- Anyone can submit an email (that's the whole point of the form) — but
-- nobody can read the list back except an admin, so it can't be scraped
-- via the public client.
create policy "newsletter_signups_insert_anyone"
  on public.newsletter_signups for insert
  with check (true);

create policy "newsletter_signups_select_admin"
  on public.newsletter_signups for select
  using (public.is_admin(auth.uid()));
