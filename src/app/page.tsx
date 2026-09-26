import { getSessionUser } from '@/lib/auth';
import { getSiteData } from '@/lib/site-data';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Ladder } from '@/components/Ladder';
import { Calendar } from '@/components/Calendar';
import { Library } from '@/components/Library';
import { Proof } from '@/components/Proof';
import { About } from '@/components/About';
import { Faq } from '@/components/Faq';
import { Vip } from '@/components/Vip';
import { Newsletter } from '@/components/Newsletter';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { isSessionBookable } from '@/lib/calendar-display';
import {
  organizationSchema,
  masterclassEventSchemas,
  workshopLibraryCourseSchema,
  faqSchema,
} from '@/lib/structuredData';

export default async function HomePage() {
  const [session, site] = await Promise.all([getSessionUser(), getSiteData()]);
  const { settings, tiers, videos, calendarSessions, testimonials, rsvpCounts } = site;

  const vipTier = tiers.find((t) => t.slug === 'vip');

  // The Ladder's "Free Masterclass" rung used to rely on its own manual
  // sold_out toggle — a third, independent field that drifted out of sync
  // with whether a session was actually open on the Calendar below it.
  // Deriving it from the real session data means there's nothing left to
  // forget to update.
  const todayStr = new Date().toISOString().slice(0, 10);
  const masterclassAvailable = calendarSessions.some((s) =>
    isSessionBookable(s, rsvpCounts[s.id] ?? 0, todayStr)
  );

  // A session with a real past date has nothing left to offer a visitor —
  // no seats to reserve, no invite to send. Left in unfiltered, it kept
  // showing up on the live Calendar (and in the Event structured data)
  // with a stale "N seats left" long after the date had passed. Sessions
  // with no date yet (unscheduled placeholders) still show — only ones
  // that have actually happened get dropped from public view.
  const publicSessions = calendarSessions.filter((s) => !s.session_date || s.session_date >= todayStr);

  // Structured data for search engines and AI answer engines — see
  // src/lib/structuredData.ts for what each schema is actually for.
  const jsonLd = [
    organizationSchema(settings),
    ...masterclassEventSchemas(publicSessions, settings),
    workshopLibraryCourseSchema(settings),
    faqSchema(),
  ];

  return (
    <>
      {jsonLd.map((schema, i) => (
        // eslint-disable-next-line react/no-danger
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Nav
        settings={settings}
        isSignedIn={Boolean(session)}
        isAdmin={session?.profile?.role === 'admin'}
        hasLibrary={videos.length > 0}
      />
      <Hero settings={settings} masterclassAvailable={masterclassAvailable} />
      <Ladder
        tiers={tiers}
        settings={settings}
        userId={session?.user.id ?? null}
        masterclassAvailable={masterclassAvailable}
      />
      <Calendar sessions={publicSessions} settings={settings} rsvpCounts={rsvpCounts} />
      <Library videos={videos} settings={settings} />
      <Proof testimonials={testimonials} />
      <About settings={settings} />
      <Faq />
      <Vip tier={vipTier} settings={settings} userId={session?.user.id ?? null} />
      <Newsletter />
      <Footer settings={settings} />
      <ScrollReveal />
      <GoogleAnalytics measurementId={settings.ga4_measurement_id} />
    </>
  );
}
