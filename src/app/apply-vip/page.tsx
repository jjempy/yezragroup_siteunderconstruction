import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { AuthHeader } from '@/components/AuthHeader';
import { VIP_REFERRAL_LABELS } from '@/lib/email';
import { submitVipApplication } from './actions';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Apply for VIP',
  description: 'Application for the VIP Intensive — reviewed personally, not open checkout.',
  robots: { index: false, follow: false },
};

export default async function ApplyVipPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string };
}) {
  const supabase = createClient();
  const [{ data: settings }, session] = await Promise.all([
    supabase.from('site_settings').select('logo_url').eq('id', 'default').maybeSingle(),
    getSessionUser(),
  ]);

  const prefillName = session?.profile?.full_name ?? '';
  const prefillEmail = session?.user.email ?? '';

  return (
    <>
      <AuthHeader logoUrl={settings?.logo_url} />
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Apply for VIP</h1>
          <p className="sub">
            This is typically the next step after a completed engagement or a masterclass — not a
            cold-start purchase. Applications are reviewed personally, not automatically approved.
            Tell us where you&apos;re coming from and what you want to work through.
          </p>

          {searchParams.sent && (
            <div className="auth-notice">
              Application sent — you&apos;ll hear back personally, usually within a few days.
            </div>
          )}
          {searchParams.error && <div className="auth-error">{searchParams.error}</div>}

          {!searchParams.sent && (
            <form action={submitVipApplication}>
              {/* Honeypot — invisible to real visitors; anything that
                  fills it in is a bot. Named "website" rather than
                  "company" since Company is a real field on this form. */}
              <div style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" type="text" required autoComplete="name" defaultValue={prefillName} />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={prefillEmail}
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <div className="field">
                <label htmlFor="company">Company (optional)</label>
                <input id="company" name="company" type="text" autoComplete="organization" />
              </div>
              <div className="field">
                <label htmlFor="referral_source">How did you hear about this?</label>
                <select id="referral_source" name="referral_source" defaultValue="other">
                  {Object.entries(VIP_REFERRAL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="message">What do you want to work through?</label>
                <textarea id="message" name="message" required rows={6} />
              </div>
              <button className="auth-submit" type="submit">
                Submit Application
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
