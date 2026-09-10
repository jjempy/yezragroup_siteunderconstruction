import { getSessionUser } from '@/lib/auth';
import { getSiteData } from '@/lib/site-data';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Ladder } from '@/components/Ladder';
import { Calendar } from '@/components/Calendar';
import { Library } from '@/components/Library';
import { Proof } from '@/components/Proof';
import { About } from '@/components/About';
import { Vip } from '@/components/Vip';
import { Newsletter } from '@/components/Newsletter';
import { Footer } from '@/components/Footer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

export default async function HomePage() {
  const [session, site] = await Promise.all([getSessionUser(), getSiteData()]);
  const { settings, tiers, videos, calendarSessions } = site;

  const vipTier = tiers.find((t) => t.slug === 'vip');

  return (
    <>
      <Nav settings={settings} isSignedIn={Boolean(session)} isAdmin={session?.profile?.role === 'admin'} />
      <Hero settings={settings} />
      <Ladder tiers={tiers} settings={settings} userId={session?.user.id ?? null} />
      <Calendar sessions={calendarSessions} />
      <Library videos={videos} settings={settings} />
      <Proof />
      <About settings={settings} />
      <Vip tier={vipTier} settings={settings} userId={session?.user.id ?? null} />
      <Newsletter />
      <Footer settings={settings} />
      <ScrollReveal />
      <GoogleAnalytics measurementId={settings.ga4_measurement_id} />
    </>
  );
}
