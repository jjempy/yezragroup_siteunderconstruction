import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PAGE_URL = 'https://orchemet.com/terms';
const PAGE_TITLE = 'Terms of Service';
const PAGE_DESCRIPTION = 'The terms covering Orchemet purchases and account use.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: PAGE_TITLE, description: PAGE_DESCRIPTION },
  twitter: { title: PAGE_TITLE, description: PAGE_DESCRIPTION },
};

export default async function TermsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('brand_name, logo_url')
    .eq('id', 'default')
    .maybeSingle();

  const brand = settings?.brand_name || 'Orchemet';
  const updated = 'September 2026';

  return (
    <>
      <AuthHeader logoUrl={settings?.logo_url} />
      <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: 60 }}>
        <div className="wrap" style={{ maxWidth: 760, paddingTop: 80, paddingBottom: 100 }}>
          <div className="eyebrow">Legal</div>
          <h1 style={{ margin: '10px 0 6px' }}>Terms of Service</h1>
          <p style={{ color: 'var(--muted-l)', fontSize: 13, marginBottom: 40 }}>Last updated: {updated}</p>

          <div className="legal-content" style={{ color: 'var(--charcoal)', fontSize: 15, lineHeight: 1.75 }}>
            <p>
              These terms cover using this site and purchasing anything through it. By creating an account
              or making a purchase, you&apos;re agreeing to them.
            </p>

            <h2>The offerings</h2>
            <ul>
              <li><strong>Free masterclasses</strong> — public, in-person sessions, first-come availability.</li>
              <li><strong>Workshop Library</strong> — a one-time purchase for lifetime access to the extended session recordings tied to your account. This is recorded content, not access to {brand} directly.</li>
              <li><strong>The Audit Room, Scoped Engagements, and the VIP Intensive</strong> — separately scoped, application- or intake-based engagements. Their own terms (scope, price, timeline) are agreed to individually before any work begins or payment is taken.</li>
            </ul>

            <h2>Payment</h2>
            <p>
              Payments are processed securely by Stripe. {brand} never sees or stores your full card
              details. Prices are shown in USD and are as listed at the time of purchase.
            </p>

            <h2>Refunds</h2>
            <p>
              The Workshop Library is sold as a digital product with immediate access on purchase. Because
              of that immediate access, purchases are generally final — but if something&apos;s genuinely
              wrong (a technical issue, a billing error, a duplicate charge),{' '}
              <a href="/contact?context=order_purchase">reach out</a> and we&apos;ll sort it out.
              Refund terms for the higher-touch engagements (the Audit Room, Scoped Engagements, VIP) are
              set individually as part of that engagement.
            </p>

            <h2>Account responsibilities</h2>
            <ul>
              <li>Keep your login credentials to yourself — your account is for your own use.</li>
              <li>Purchased access (like the Workshop Library) is for you individually, not for redistribution or resale.</li>
              <li>Give us accurate information when you create an account or make a purchase.</li>
            </ul>

            <h2>Content</h2>
            <p>
              Everything on this site — recordings, worksheets, written material — belongs to {brand} and
              is licensed to you for personal use when purchased, not sold outright. Don&apos;t reproduce,
              redistribute, or resell it.
            </p>

            <h2>No guarantee of results</h2>
            <p>
              Masterclasses, workshops, and advisory engagements are educational and advisory in nature.
              Nothing here is a guarantee of any particular business outcome — results depend on you and
              your business.
            </p>

            <h2>Account termination</h2>
            <p>
              We can suspend or close an account that violates these terms (for example, sharing paid
              access) or is used abusively. You can close your own account any time by contacting us.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              If these terms change in a meaningful way, the &quot;Last updated&quot; date above will
              change too. Continued use of the site after an update means you accept the revised terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms: <a href="/contact">contact us</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
