-- A manual "sold out" switch per ladder tier, with an admin-authored
-- message shown instead of the checkout button. Stripe's own Payment
-- Link "limit number of payments" setting is what actually stops a
-- capped tier (like Audit Room) from taking more payments than intended
-- — but this site has no live visibility into that Stripe-side state on
-- its own, so this is the manual bridge: once the admin sees (in Stripe)
-- that a link's cap is reached, they flip this, and the site
-- immediately shows a real, factual message instead of a dead-end
-- checkout button.
alter table public.ladder_tiers
  add column if not exists sold_out boolean not null default false,
  add column if not exists sold_out_message text not null default '';

comment on column public.ladder_tiers.sold_out is
  'Manually set once the tier''s Stripe Payment Link has hit its payment limit (or otherwise shouldn''t take more orders right now). Shows sold_out_message instead of the checkout button.';
comment on column public.ladder_tiers.sold_out_message is
  'Shown instead of the CTA button while sold_out is true. Write it however fits — e.g. "This month''s Audit Room is full — the next one opens November 1."';
