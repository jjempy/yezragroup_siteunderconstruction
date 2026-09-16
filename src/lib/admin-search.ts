import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CalendarSession, LadderTier, SiteSettings, Testimonial, VideoRow, PaidVideoRow } from '@/types/database';

export interface AdminSearchMatch {
  page: string;
  pageLabel: string;
  fieldLabel: string;
  fieldId: string;
  snippet: string;
}

const SITE_SETTINGS_FIELDS: { key: keyof SiteSettings; page: string; pageLabel: string; fieldLabel: string }[] = [
  { key: 'brand_name', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Brand Name' },
  { key: 'logo_url', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Logo URL' },
  { key: 'hero_mark_url', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Hero Background Mark URL' },
  { key: 'color_gold', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Gold Color' },
  { key: 'color_gold_deep', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Gold Deep Color' },
  { key: 'color_ink', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Ink Color' },
  { key: 'color_cream', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Cream Color' },
  { key: 'heading_font', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Heading Font' },
  { key: 'body_font', page: '/admin/brand', pageLabel: 'Brand', fieldLabel: 'Body Font' },
  { key: 'hero_eyebrow', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Hero Eyebrow' },
  { key: 'hero_heading', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Hero Heading' },
  { key: 'hero_lede', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Hero Subheading' },
  { key: 'calendar_eyebrow', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Masterclass Section Eyebrow' },
  { key: 'calendar_heading', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Masterclass Section Heading' },
  { key: 'calendar_lede', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Masterclass Section Subheading' },
  { key: 'founder_photo_url', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Founder Photo URL' },
  { key: 'contact_email', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Contact Email' },
  { key: 'contact_phone', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Contact Phone' },
  { key: 'youtube_channel_url', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'YouTube Channel URL' },
  { key: 'spotify_url', page: '/admin/content', pageLabel: 'Hero & About', fieldLabel: 'Spotify URL' },
];

function snippetAround(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 80);
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

function matches(haystack: string | null | undefined, query: string): boolean {
  return Boolean(haystack) && haystack!.toLowerCase().includes(query.toLowerCase());
}

/** Searches every admin-editable piece of content (site settings, offers,
 * testimonials, calendar sessions, videos) for a substring, returning
 * enough to render a "page → field" result and jump straight to it. Not a
 * generic full-text index — a flat scan of a few dozen known fields,
 * which is all "admin content" actually is here. */
export async function searchAdminContent(rawQuery: string): Promise<AdminSearchMatch[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const admin = createAdminClient();
  const results: AdminSearchMatch[] = [];

  const [{ data: settings }, { data: tiers }, { data: testimonials }, { data: sessions }, { data: videos }, { data: paidVideos }] =
    await Promise.all([
      admin.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>(),
      admin.from('ladder_tiers').select('*'),
      admin.from('testimonials').select('*'),
      admin.from('calendar_sessions').select('*'),
      admin.from('videos').select('*'),
      admin.from('paid_videos').select('*'),
    ]);

  if (settings) {
    for (const field of SITE_SETTINGS_FIELDS) {
      const value = settings[field.key];
      if (typeof value === 'string' && matches(value, query)) {
        results.push({
          page: field.page,
          pageLabel: field.pageLabel,
          fieldLabel: field.fieldLabel,
          fieldId: field.key,
          snippet: snippetAround(value, query),
        });
      }
    }
    const aboutJoined = settings.about_body?.join(' ') ?? '';
    if (matches(aboutJoined, query)) {
      results.push({
        page: '/admin/content',
        pageLabel: 'Hero & About',
        fieldLabel: 'About Paragraphs',
        fieldId: 'about_body',
        snippet: snippetAround(aboutJoined, query),
      });
    }
  }

  for (const tier of (tiers as LadderTier[] | null) ?? []) {
    const rowFields: { key: keyof LadderTier; label: string }[] = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'price_label', label: 'Price' },
      { key: 'price_sub_label', label: 'Price Sub-label' },
      { key: 'cta_label', label: 'Button Label' },
      { key: 'sold_out_message', label: 'Sold-out Message' },
    ];
    for (const f of rowFields) {
      const value = tier[f.key];
      if (typeof value === 'string' && matches(value, query)) {
        results.push({
          page: '/admin/offers',
          pageLabel: 'Offers',
          fieldLabel: `${tier.title || tier.slug} — ${f.label}`,
          fieldId: `${f.key}-${tier.id}`,
          snippet: snippetAround(value, query),
        });
      }
    }
  }

  for (const t of (testimonials as Testimonial[] | null) ?? []) {
    const rowFields: { key: keyof Testimonial; label: string }[] = [
      { key: 'quote', label: 'Quote' },
      { key: 'name', label: 'Name' },
      { key: 'title', label: 'Title' },
      { key: 'company', label: 'Company' },
    ];
    for (const f of rowFields) {
      const value = t[f.key];
      if (typeof value === 'string' && matches(value, query)) {
        results.push({
          page: '/admin/testimonials',
          pageLabel: 'Testimonials',
          fieldLabel: `${t.name || 'Testimonial'} — ${f.label}`,
          fieldId: `${f.key}-${t.id}`,
          snippet: snippetAround(value, query),
        });
      }
    }
  }

  for (const s of (sessions as CalendarSession[] | null) ?? []) {
    const rowFields: { key: keyof CalendarSession; label: string }[] = [
      { key: 'label', label: 'Month/Label' },
      { key: 'topic', label: 'Topic' },
      { key: 'location', label: 'Location' },
      { key: 'date_text', label: 'Date/Time' },
      { key: 'status', label: 'Status' },
    ];
    for (const f of rowFields) {
      const value = s[f.key];
      if (typeof value === 'string' && matches(value, query)) {
        results.push({
          page: '/admin/calendar',
          pageLabel: 'Calendar',
          fieldLabel: `${s.label} — ${f.label}`,
          fieldId: `${f.key}-${s.id}`,
          snippet: snippetAround(value, query),
        });
      }
    }
  }

  for (const v of (videos as VideoRow[] | null) ?? []) {
    if (matches(v.title, query)) {
      results.push({
        page: '/admin/videos',
        pageLabel: 'Workshop Videos',
        fieldLabel: `${v.title} — Title`,
        fieldId: `title-${v.id}`,
        snippet: snippetAround(v.title, query),
      });
    }
  }

  for (const v of (paidVideos as PaidVideoRow[] | null) ?? []) {
    if (matches(v.title, query)) {
      results.push({
        page: '/admin/extended-videos',
        pageLabel: 'Extended Videos',
        fieldLabel: `${v.title} — Title`,
        fieldId: `title-${v.id}`,
        snippet: snippetAround(v.title, query),
      });
    }
  }

  return results.slice(0, 25);
}
