// Client-safe (no 'server-only') — unlike most of the email-copy labels
// in lib/email.ts, these two need to be importable from the VIP
// application form itself (a client component, for the "who referred
// you" conditional field), not just from server code building emails.

export const VIP_REFERRAL_LABELS: Record<string, string> = {
  scoped_engagement: 'Completed a Scoped Engagement',
  masterclass: 'Attended a masterclass',
  referred: 'Referred by someone',
  other: 'Other',
};

export const VIP_ANNUAL_REVENUE_LABELS: Record<string, string> = {
  under_500k: 'Less than $500k',
  '500k_1m': '$500k – $1M',
  '1m_3m': '$1M – $3M',
  '3m_5m': '$3M – $5M',
  '5m_10m': '$5M – $10M',
  over_10m: 'More than $10M',
};

// A real sales pipeline (this table stands in for a CRM — Airtable —
// until that's set up) rather than the generic new/reviewed/resolved
// this started with. Order matters here: it's the order the admin's
// status dropdown lists them in, roughly the order a deal moves through.
export const VIP_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  discovery_scheduled: 'Discovery Call Scheduled',
  close_scheduled: 'Close Call Scheduled',
  sale: 'Sale',
  no_sale: 'No Sale',
};
