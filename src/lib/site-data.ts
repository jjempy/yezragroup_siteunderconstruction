import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CalendarSession, LadderTier, SiteSettings, Testimonial, VideoRow } from '@/types/database';

export interface SiteData {
  settings: SiteSettings;
  tiers: LadderTier[];
  videos: VideoRow[];
  calendarSessions: CalendarSession[];
  testimonials: Testimonial[];
  // Session id -> RSVP count. Fetched with the service-role client and
  // reduced to a plain count here — masterclass_rsvps holds name/email/
  // phone, which the public site should never read even in aggregate, so
  // this is the one piece of that table's data allowed to reach the page.
  rsvpCounts: Record<string, number>;
}

const FALLBACK_SETTINGS: SiteSettings = {
  id: 'default',
  brand_name: 'Orchemet',
  logo_url: '',
  hero_logo_watermark: false,
  hero_mark_url: '',
  hero_mark_opacity: 35,
  color_gold: '',
  color_gold_deep: '',
  color_ink: '',
  color_cream: '',
  heading_font: '',
  body_font: '',
  founder_photo_url: '',
  ga4_measurement_id: '',
  youtube_channel_url: '',
  spotify_url: '',
  contact_email: '',
  contact_phone: '',
  vip_application_url: '',
  scoped_engagement_url: '',
  stripe_workshop_library_url: '',
  stripe_group_masterclass_url: '',
  hero_eyebrow: 'Testimony, Not Theory',
  hero_heading:
    "Clarity for the business you're *actually* running — not the one you keep telling people about.",
  hero_lede:
    "Free public masterclasses, hands-on workshops, and private engagements — built on one idea: the biggest risk to a growing business usually isn't what you don't know. It's what nobody around you will say out loud.",
  calendar_eyebrow: 'The Year Ahead',
  calendar_heading: 'A free masterclass, almost every month.',
  calendar_lede:
    "One live, in-person session most months — always free, always open, always built around a blind spot business owners don't know they have until it costs them.",
  about_body: [
    "Fifteen years in precision manufacturing engineering, state-licensed in insurance, and self-taught in building working AI systems — that's an unusual stack, and it's the whole point.",
    "I spent those years building things other people trusted to be right the first time — tooling, training manuals, vendor systems where a small mistake got expensive fast. When I started building AI tools, it wasn't to keep up with a trend. I built them to catch my own blind spots first, before I ever thought about teaching anyone else to do the same.",
    'Faith and stewardship shape how decisions get made here — not as a slogan, but as the actual filter.',
  ],
  updated_at: new Date().toISOString(),
};

// Mirrors the seed rows in supabase/migrations/0001_init.sql, so the site
// still looks like the real thing (design + copy) if a page is opened
// before Supabase is configured, or if Supabase is briefly unreachable.
const FALLBACK_TIERS: LadderTier[] = [
  {
    id: 'fallback-masterclass',
    slug: 'masterclass',
    sort_order: 1,
    title: 'Free Masterclass',
    description:
      "A live, in-person session. 20 minutes of real content, the rest spent building something together — and a clear next step at the end, if it's right for you.",
    price_label: 'Free',
    price_sub_label: 'In Person',
    cta_label: 'See Dates',
    cta_href: '#calendar',
    is_visible: true,
    is_top: false,
    sold_out: false,
    sold_out_message: '',
    updated_at: '',
  },
  {
    id: 'fallback-workshop-library',
    slug: 'workshop_library',
    sort_order: 2,
    title: 'Early Access',
    description:
      'Every masterclass and workshop, uncut and organized, yours before any of it reaches YouTube — plus the worksheets that go with each one. This is recorded content, not access to me directly. No Q&A, no correspondence.',
    price_label: '$147',
    price_sub_label: 'Full Access',
    cta_label: 'Get Access',
    cta_href: '',
    is_visible: true,
    is_top: false,
    sold_out: false,
    sold_out_message: '',
    updated_at: '',
  },
  {
    id: 'fallback-audit-room',
    slug: 'audit_room',
    sort_order: 3,
    title: 'The Audit Room',
    description:
      'You already have the audit — you got it free. This is where you actually finish it: live, on your real business, with nine other owners who have no reason to let you avoid your own answer. Not more to watch — one live room, once a month, capped at ten.',
    price_label: '$497',
    price_sub_label: 'Per Seat',
    cta_label: 'Claim Your Seat',
    cta_href: '',
    is_visible: true,
    is_top: false,
    sold_out: false,
    sold_out_message: '',
    updated_at: '',
  },
  {
    id: 'fallback-scoped-engagement',
    slug: 'scoped_engagement',
    sort_order: 4,
    title: 'Scoped Engagement',
    description:
      "A defined project, a defined outcome, a one-page scope before we start. This is advisory work — strategy, systems, and training your team to run it themselves. I'm not writing your code or running your floor; I'm making sure you and your people know exactly how to. Built for one business at a time, and priced for problems that are actually worth solving this way.",
    price_label: 'From $25,000',
    price_sub_label: 'Per Project',
    cta_label: 'Start a Conversation',
    cta_href: '',
    is_visible: true,
    is_top: false,
    sold_out: false,
    sold_out_message: '',
    updated_at: '',
  },
  {
    id: 'fallback-vip',
    slug: 'vip',
    sort_order: 5,
    title: 'The VIP Intensive',
    description:
      'A private day. One-on-one, start to finish, plus a recorded conversation for your own audience. By application only.',
    price_label: 'By Application',
    price_sub_label: '3-Hour Day',
    cta_label: 'Apply',
    cta_href: '',
    is_visible: true,
    is_top: true,
    sold_out: false,
    sold_out_message: '',
    updated_at: '',
  },
];

const FALLBACK_CALENDAR_SESSIONS: CalendarSession[] = [
  {
    id: 'fallback-session-1',
    sort_order: 1,
    label: 'September 2026',
    topic: "The 5 Blind Spots That Are Quietly Costing You the Business You're Building",
    location: 'Ashley River Library, Dorchester County',
    date_text: 'Sept 21, 10:00 AM – 12:00 PM',
    status: 'Open',
    is_visible: true,
    created_at: '',
    session_date: null,
    capacity: null,
  },
];

/**
 * Loads every CONFIG-equivalent value from Supabase for the public site.
 * Uses the anon/RLS-scoped client — rows hidden by admins (is_visible =
 * false) are already filtered out by RLS, so nothing extra to check here
 * except "is the list/value empty" for the hide-if-empty sections.
 *
 * Falls back to the same seed content the migration ships (matching the
 * original static design) if Supabase isn't configured yet or is briefly
 * unreachable, rather than showing an error page — see README "Preview
 * without Supabase".
 */
export async function getSiteData(): Promise<SiteData> {
  try {
    const supabase = createClient();

    const [{ data: settings }, { data: tiers }, { data: videos }, { data: calendarSessions }, { data: testimonials }] =
      await Promise.all([
        supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>(),
        supabase.from('ladder_tiers').select('*').eq('is_visible', true).order('sort_order'),
        supabase.from('videos').select('*').eq('is_visible', true).order('sort_order'),
        supabase
          .from('calendar_sessions')
          .select('*')
          .eq('is_visible', true)
          .order('sort_order'),
        supabase.from('testimonials').select('*').eq('is_visible', true).order('sort_order'),
      ]);

    // RSVP rows hold name/email/phone — never readable by the anon/RLS
    // client at all (see 0011 migration), so a plain count needs the
    // service-role client. Reduced to counts-per-session immediately;
    // nothing but that count ever leaves this function.
    const rsvpCounts: Record<string, number> = {};
    try {
      const admin = createAdminClient();
      const { data: rsvpRows } = await admin.from('masterclass_rsvps').select('calendar_session_id');
      for (const row of (rsvpRows as { calendar_session_id: string }[] | null) ?? []) {
        rsvpCounts[row.calendar_session_id] = (rsvpCounts[row.calendar_session_id] ?? 0) + 1;
      }
    } catch {
      // Service-role key not configured, or the table doesn't exist yet
      // (0011 migration not run) — capacity/scarcity messaging just
      // won't show; never block the rest of the page over this.
    }

    return {
      settings: settings ?? FALLBACK_SETTINGS,
      tiers: (tiers as LadderTier[] | null)?.length ? (tiers as LadderTier[]) : FALLBACK_TIERS,
      videos: (videos as VideoRow[]) ?? [],
      calendarSessions: (calendarSessions as CalendarSession[] | null)?.length
        ? (calendarSessions as CalendarSession[])
        : FALLBACK_CALENDAR_SESSIONS,
      testimonials: (testimonials as Testimonial[]) ?? [],
      rsvpCounts,
    };
  } catch {
    // Supabase env vars missing/invalid, or the project is unreachable —
    // show the site with its original seed content instead of a 500.
    return {
      settings: FALLBACK_SETTINGS,
      tiers: FALLBACK_TIERS,
      videos: [],
      calendarSessions: FALLBACK_CALENDAR_SESSIONS,
      testimonials: [],
      rsvpCounts: {},
    };
  }
}

/** Resolves a ladder tier's button target: an in-page anchor, a direct
 * Stripe Payment Link, or an external intake form — appending
 * client_reference_id so the Stripe webhook can tie a purchase back to a
 * signed-in user. Mirrors the old `data-checkout` map in CONFIG's script. */
export function resolveTierHref(
  tier: LadderTier,
  settings: SiteSettings,
  userId: string | null
): { href: string; configured: boolean } {
  switch (tier.slug) {
    case 'masterclass':
      return { href: '#calendar', configured: true };
    case 'workshop_library': {
      // Always routed through /api/checkout/workshop-library: it sends
      // signed-out visitors to sign up/log in first, then on to Stripe with
      // client_reference_id set, so the webhook can always tie the purchase
      // back to an account (never a client-side flag).
      if (!settings.stripe_workshop_library_url) return { href: '#', configured: false };
      return { href: '/api/checkout/workshop-library', configured: true };
    }
    case 'audit_room':
      // Routed through /api/checkout/audit-room (not straight to Stripe) so
      // client_reference_id gets attached — same reasoning as Workshop
      // Library above.
      return settings.stripe_group_masterclass_url
        ? { href: '/api/checkout/audit-room', configured: true }
        : { href: '#', configured: false };
    case 'scoped_engagement':
      // The $2,000 Engagement Deposit — same client_reference_id treatment.
      return settings.scoped_engagement_url
        ? { href: '/api/checkout/scoped-engagement-deposit', configured: true }
        : { href: '#', configured: false };
    case 'vip':
      return settings.vip_application_url
        ? { href: settings.vip_application_url, configured: true }
        : { href: '#', configured: false };
    default:
      return { href: tier.cta_href || '#', configured: Boolean(tier.cta_href) };
  }
}
