import type { CalendarSession, SiteSettings } from '@/types/database';
import { FAQ_ITEMS } from '@/components/Faq';

const SITE_URL = 'https://orchemet.com';

/** Organization schema — the base identity signal every other schema on
 * the site references back to (via `organizer`/`provider`). */
export function organizationSchema(settings: SiteSettings) {
  const sameAs = [settings.youtube_channel_url, settings.spotify_url].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brand_name || 'Orchemet',
    url: SITE_URL,
    ...(settings.logo_url ? { logo: settings.logo_url } : {}),
    description:
      "Free masterclasses, workshops, and advisory engagements for business owners working around a blind spot instead of through it.",
    // The founder's name previously appeared nowhere machine-readable —
    // an audit-flagged trust gap for search/AI answer engines specifically
    // (a real Person behind the brand, not just an email in a contact
    // point). Fixed name, not settings-driven: there's no admin field for
    // this, and it isn't the kind of thing that changes.
    founder: { '@type': 'Person', name: 'Joseph Jeffers' },
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.contact_email
      ? { contactPoint: { '@type': 'ContactPoint', email: settings.contact_email, contactType: 'customer support' } }
      : {}),
  };
}

/** One Event per visible, dated masterclass session — this is the
 * structured data most likely to actually surface a specific session in
 * Google's rich results or get cited by an AI answering "free business
 * workshops near me" style queries. Undated sessions are skipped; a
 * schema.org Event needs a real startDate to be valid/useful. Callers are
 * expected to pass already-past-filtered sessions (see page.tsx's
 * publicSessions) — this only guards against a missing date, not a stale
 * one. */
export function masterclassEventSchemas(sessions: CalendarSession[], settings: SiteSettings) {
  return sessions
    .filter((s) => s.session_date)
    .map((s) => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: s.topic,
      startDate: s.session_date,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      ...(s.location
        ? { location: { '@type': 'Place', name: s.location, address: s.location } }
        : {}),
      description: s.topic,
      isAccessibleForFree: true,
      organizer: { '@type': 'Organization', name: settings.brand_name || 'Orchemet', url: SITE_URL },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: s.status?.toLowerCase() === 'full' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        url: `${SITE_URL}/#calendar`,
      },
    }));
}

/** Course schema for the paid Workshop Library — a recognized type for
 * "structured educational content," which is exactly what this is. */
export function workshopLibraryCourseSchema(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'The Workshop Library',
    description:
      'The full, uncut recordings of every masterclass and workshop — longer than the free public edit, with the parts that don\'t make the public cut.',
    provider: { '@type': 'Organization', name: settings.brand_name || 'Orchemet', url: SITE_URL },
    offers: { '@type': 'Offer', price: '147', priceCurrency: 'USD', category: 'Paid', url: `${SITE_URL}/#library` },
  };
}

/** FAQPage schema mirrors the Faq component's own Q&A list exactly — this
 * is the single highest-leverage structured data on the page for AI
 * answer engines specifically: clean question/answer pairs are exactly
 * what gets extracted and cited verbatim. */
export function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
