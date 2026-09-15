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
import {
  organizationSchema,
  masterclassEventSchemas,
  workshopLibraryCourseSchema,
  faqSchema,
} from '@/lib/structuredData';

export default async function HomePage() {
  const [session, site] = await Promise.all([getSessionUser(), getSiteData()]);
  const { settings, tiers, videos, calendarSessions, testimonials } = site;

  const vipTier = tiers.find((t) => t.slug === 'vip');

  // Structured data for search engines and AI answer engines — see
  // src/lib/structuredData.ts for what each schema is actually for.
  const jsonLd = [
    organizationSchema(settings),
    ...masterclassEventSchemas(calendarSessions, settings),
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
      <Nav settings={settings} isSignedIn={Boolean(session)} isAdmin={session?.profile?.role === 'admin'} />
      <Hero settings={settings} />
      <Ladder tiers={tiers} settings={settings} userId={session?.user.id ?? null} />
      <Calendar sessions={calendarSessions} settings={settings} />
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
