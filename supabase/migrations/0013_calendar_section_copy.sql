-- The homepage calendar section's heading/subhead were hardcoded in
-- Calendar.tsx — every other section's copy (hero, about, ladder tiers)
-- has been admin-editable for a while, and this one's actively being
-- iterated on. Defaults below are the corrected copy (fixes a real
-- internal inconsistency: "12 months. 12 masterclasses." promised
-- exactly one a month while the body text hedged with "most months").
alter table public.site_settings
  add column if not exists calendar_eyebrow text not null default 'The Year Ahead',
  add column if not exists calendar_heading text not null default 'A free masterclass, almost every month.',
  add column if not exists calendar_lede text not null default 'One live, in-person session most months — always free, always open, always built around a blind spot business owners don''t know they have until it costs them.';
