-- Optional RSVP cap per masterclass session — null means unlimited.
-- Paired with the real RSVP count (masterclass_rsvps), this drives a
-- factually-accurate "this session is full" state on the public card
-- instead of relying only on the admin remembering to flip the manual
-- Status field to "Full".
alter table public.calendar_sessions
  add column if not exists capacity integer;

comment on column public.calendar_sessions.capacity is
  'Max RSVPs for this session. Null = unlimited. Compared against a live count of masterclass_rsvps to show scarcity/full-session messaging on the public site.';
