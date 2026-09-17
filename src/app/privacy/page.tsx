import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Orchemet collects, why, and who it is shared with.',
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('brand_name, contact_email, logo_url')
    .eq('id', 'default')
    .maybeSingle();

  const brand = settings?.brand_name || 'Orchemet';
  const email = settings?.contact_email || '';
  const updated = 'September 2026';

  return (
    <>
      <AuthHeader logoUrl={settings?.logo_url} />
      <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: 60 }}>
        <div className="wrap" style={{ maxWidth: 760, paddingTop: 80, paddingBottom: 100 }}>
          <div className="eyebrow">Legal</div>
          <h1 style={{ margin: '10px 0 6px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--muted-l)', fontSize: 13, marginBottom: 40 }}>Last updated: {updated}</p>

          <div className="legal-content" style={{ color: 'var(--charcoal)', fontSize: 15, lineHeight: 1.75 }}>
            <p>
              This policy explains what {brand} collects when you use this site, why, and who it&apos;s
              shared with. It&apos;s written in plain language on purpose — if anything here is unclear,
              {email ? <> email <a href={`mailto:${email}`}>{email}</a></> : ' reach out'} and ask.
            </p>

            <h2>What we collect</h2>
            <ul>
              <li><strong>Account information</strong> — name, email address, and phone number, when you create an account.</li>
              <li><strong>Purchase information</strong> — what you bought and when. Payment card details are never collected or stored by {brand} — they go directly to Stripe, our payment processor.</li>
              <li><strong>Usage information</strong> — basic site analytics (pages visited, general location/device type) via Google Analytics, and which Workshop Library episodes an account has opened, so the library can show accurate progress.</li>
              <li><strong>Newsletter signups</strong> — an email address, if you sign up separately for updates, kept apart from any purchase or account data.</li>
            </ul>

            <h2>How it&apos;s used</h2>
            <ul>
              <li>To create and secure your account, and to grant access to what you&apos;ve purchased.</li>
              <li>To communicate with you about your account, a purchase, or a session you&apos;ve registered for.</li>
              <li>To understand, in aggregate, how the site is used — never to build an individual profile for advertising.</li>
              <li>To keep accurate financial and bookkeeping records.</li>
            </ul>
            <p>We do not sell your information. We do not share it with third parties for their own marketing.</p>

            <h2>Who it&apos;s shared with</h2>
            <p>Only the services that make the site work, each acting as a data processor on our behalf:</p>
            <ul>
              <li><strong>Stripe</strong> — payment processing.</li>
              <li><strong>Supabase</strong> — account authentication and database hosting.</li>
              <li><strong>Vercel</strong> — application hosting.</li>
              <li><strong>Google Analytics</strong> — aggregate site usage statistics.</li>
            </ul>

            <h2>Your choices</h2>
            <ul>
              <li>You can update your name and phone number any time from your Account page.</li>
              <li>You can opt out of marketing email at signup, or by contacting us.</li>
              <li>
                You can ask us to delete your account and associated personal data at any time
                {email ? <> — email <a href={`mailto:${email}`}>{email}</a></> : ''}. Purchase and financial
                records may be retained as required by law even after an account is deleted.
              </li>
            </ul>

            <h2>Security</h2>
            <p>
              Account access is protected by Supabase Auth. Administrative access to purchase, user, and
              content data is restricted to authorized admins and enforced at the database level, not just
              in the app&apos;s interface.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              If this policy changes in a meaningful way, the &quot;Last updated&quot; date above will change
              too. Continued use of the site after an update means you accept the revised policy.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this policy or your data:{' '}
              {email ? <a href={`mailto:${email}`}>{email}</a> : 'use the contact information on the homepage'}.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
