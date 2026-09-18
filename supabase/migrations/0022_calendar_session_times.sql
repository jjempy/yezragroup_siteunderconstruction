-- date_text ("Sept 21, 10:00 AM – 12:00 PM") is free-typed admin copy —
-- fine for display, but not safely parseable into a real start/end time
-- for a calendar invite. These give "Add to Calendar" (Google/Outlook
-- links + an .ics attachment with a 1hr-before reminder) something
-- structured to build from. Both nullable: a session without them just
-- doesn't get calendar-invite buttons in its confirmation/reminder email,
-- same graceful-degrade posture as every other optional field here.
alter table public.calendar_sessions
  add column if not exists start_time text,
  add column if not exists end_time text;
