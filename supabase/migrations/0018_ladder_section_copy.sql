-- The Offers section's eyebrow/heading/lede ("Five Ways We Work
-- Together" / "From a free evening to a private day." / "Start wherever
-- makes sense...") were hardcoded directly in Ladder.tsx — every other
-- section (hero, calendar) already has this admin-editable, so this
-- closes that gap rather than leaving one section permanently stuck.
alter table public.site_settings
  add column if not exists ladder_eyebrow text not null default 'Five Ways We Work Together',
  add column if not exists ladder_heading text not null default 'From a free evening to a private day.',
  add column if not exists ladder_lede text not null default 'Start wherever makes sense. Most people move up the ladder as trust builds — nobody''s asked to jump in at the top.';
