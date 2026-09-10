import { createClient } from '@/lib/supabase/server';
import type { CalendarSession, LadderTier, SiteSettings, VideoRow } from '@/types/database';

export interface SiteData {
  settings: SiteSettings;
  tiers: LadderTier[];
  videos: VideoRow[];
  calendarSessions: CalendarSession[];
}

const FALLBACK_SETTINGS: SiteSettings = {
  id: 'default',
  brand_name: 'Orchemet',
  logo_url: '',
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
  about_body: [],
  updated_at: new Date().toISOString(),
};

/**
 * Loads every CONFIG-equivalent value from Supabase for the public site.
 * Uses the anon/RLS-scoped client — rows hidden by admins (is_visible =
 * false) are already filtered out by RLS, so nothing extra to check here
 * except "is the list/value empty" for the hide-if-empty sections.
 */
export async function getSiteData(): Promise<SiteData> {
  const supabase = createClient();

  const [{ data: settings }, { data: tiers }, { data: videos }, { data: calendarSessions }] =
    await Promise.all([
      supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>(),
      supabase.from('ladder_tiers').select('*').eq('is_visible', true).order('sort_order'),
      supabase.from('videos').select('*').eq('is_visible', true).order('sort_order'),
      supabase
        .from('calendar_sessions')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order'),
    ]);

  return {
    settings: settings ?? FALLBACK_SETTINGS,
    tiers: (tiers as LadderTier[]) ?? [],
    videos: (videos as VideoRow[]) ?? [],
    calendarSessions: (calendarSessions as CalendarSession[]) ?? [],
  };
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
      return settings.stripe_group_masterclass_url
        ? { href: settings.stripe_group_masterclass_url, configured: true }
        : { href: '#', configured: false };
    case 'scoped_engagement':
      return settings.scoped_engagement_url
        ? { href: settings.scoped_engagement_url, configured: true }
        : { href: '#', configured: false };
    case 'vip':
      return settings.vip_application_url
        ? { href: settings.vip_application_url, configured: true }
        : { href: '#', configured: false };
    default:
      return { href: tier.cta_href || '#', configured: Boolean(tier.cta_href) };
  }
}
