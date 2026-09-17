// Hand-written types matching supabase/migrations/0001_init.sql.
// If you prefer generated types, run:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// and re-export the pieces below from the generated `Database` type instead.

export type Role = 'standard' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  blocked: boolean;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string;
  product: string;
  stripe_checkout_session_id: string | null;
  stripe_customer_id: string | null;
  granted_at: string;
  source: string;
  amount_total: number | null;
  currency: string | null;
  status: string;
  note: string | null;
  roster_opt_in: boolean;
}

export interface SiteSettings {
  id: string;
  brand_name: string;
  logo_url: string;
  hero_logo_watermark: boolean;
  hero_mark_url: string;
  hero_mark_opacity: number;
  color_gold: string;
  color_gold_deep: string;
  color_ink: string;
  color_cream: string;
  heading_font: string;
  body_font: string;
  founder_photo_url: string;
  ga4_measurement_id: string;
  youtube_channel_url: string;
  spotify_url: string;
  contact_email: string;
  contact_phone: string;
  vip_application_url: string;
  scoped_engagement_url: string;
  stripe_workshop_library_url: string;
  stripe_group_masterclass_url: string;
  hero_eyebrow: string;
  hero_heading: string;
  hero_lede: string;
  calendar_eyebrow: string;
  calendar_heading: string;
  calendar_lede: string;
  ladder_eyebrow: string;
  ladder_heading: string;
  ladder_lede: string;
  about_body: string[];
  updated_at: string;
}

export type LadderSlug =
  | 'masterclass'
  | 'workshop_library'
  | 'audit_room'
  | 'scoped_engagement'
  | 'vip';

export interface LadderTier {
  id: string;
  slug: LadderSlug;
  sort_order: number;
  title: string;
  description: string;
  price_label: string;
  price_sub_label: string;
  cta_label: string;
  cta_href: string;
  is_visible: boolean;
  is_top: boolean;
  sold_out: boolean;
  sold_out_message: string;
  updated_at: string;
}

// The always-free, publicly-released edited masterclass recap episodes —
// same ones hosted on YouTube, shown unlocked on the homepage. No gating,
// no preview clipping; this table is never behind a paywall.
export interface VideoRow {
  id: string;
  sort_order: number;
  title: string;
  youtube_id: string;
  duration: string;
  is_visible: boolean;
  created_at: string;
}

// The paid-only "Early Access" bonus cut of each session — longer, less
// edited, with additional insights. This is what the $147 tier actually
// unlocks; non-buyers get a short clipped preview (preview_seconds) of
// this exclusive content, not of the free videos above.
export interface PaidVideoRow {
  id: string;
  sort_order: number;
  title: string;
  youtube_id: string;
  duration: string;
  preview_seconds: number;
  is_visible: boolean;
  created_at: string;
}

export interface CalendarSession {
  id: string;
  sort_order: number;
  label: string;
  topic: string;
  location: string;
  date_text: string;
  status: string;
  is_visible: boolean;
  created_at: string;
  // Admin-only sorting/tracking aid — see 0008 migration. The public site
  // keeps showing date_text as-is; this never renders on the homepage.
  session_date: string | null;
  // Optional RSVP cap — null means unlimited. See 0015 migration.
  capacity: number | null;
}

export interface MasterclassRsvp {
  id: string;
  calendar_session_id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  reminder_sent_at: string | null;
}

export type ContactReason =
  | 'general'
  | 'account_access'
  | 'order_purchase'
  | 'masterclass_schedule'
  | 'other';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  reason: string;
  message: string;
  status: 'new' | 'read' | 'resolved';
  created_at: string;
}

export interface Testimonial {
  id: string;
  sort_order: number;
  quote: string;
  name: string;
  title: string;
  company: string;
  is_visible: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      entitlements: { Row: Entitlement; Insert: Partial<Entitlement>; Update: Partial<Entitlement> };
      site_settings: { Row: SiteSettings; Insert: Partial<SiteSettings>; Update: Partial<SiteSettings> };
      ladder_tiers: { Row: LadderTier; Insert: Partial<LadderTier>; Update: Partial<LadderTier> };
      videos: { Row: VideoRow; Insert: Partial<VideoRow>; Update: Partial<VideoRow> };
      calendar_sessions: { Row: CalendarSession; Insert: Partial<CalendarSession>; Update: Partial<CalendarSession> };
      masterclass_rsvps: { Row: MasterclassRsvp; Insert: Partial<MasterclassRsvp>; Update: Partial<MasterclassRsvp> };
      contact_messages: { Row: ContactMessage; Insert: Partial<ContactMessage>; Update: Partial<ContactMessage> };
    };
  };
}
