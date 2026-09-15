-- Tracks whether a day-before reminder email has already gone out for a
-- given RSVP, so the daily reminder cron never double-sends if it fires
-- more than once, or a session's date changes after a reminder already
-- went out for the old date.
alter table public.masterclass_rsvps
  add column if not exists reminder_sent_at timestamptz;
