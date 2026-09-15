-- Audit Room cohort roster consent — opted OUT by default. A client
-- chooses to opt in if they want their name visible to the rest of
-- their session's cohort; nothing about someone's presence in a paid
-- session is visible to others without their explicit choice.
alter table public.entitlements
  add column if not exists roster_opt_in boolean not null default false;

comment on column public.entitlements.roster_opt_in is
  'Audit Room only: whether this client has opted in to being visible (by name) to the rest of their session''s cohort. Defaults to false (opted out) — a plain-consent, no-surprises default, not just a technicality.';
