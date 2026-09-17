import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { AuthHeader } from '@/components/AuthHeader';
import { CONTACT_REASON_LABELS } from '@/lib/email';
import { submitContactMessage } from './actions';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch — account access, orders, masterclass scheduling, or a general question.',
  robots: { index: true, follow: true },
};

const VALID_REASONS = new Set(Object.keys(CONTACT_REASON_LABELS));

export default async function ContactPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string; context?: string; email?: string; name?: string };
}) {
  const supabase = createClient();
  const [{ data: settings }, session] = await Promise.all([
    supabase.from('site_settings').select('logo_url').eq('id', 'default').maybeSingle(),
    getSessionUser(),
  ]);

  // "Smart" prefill: whichever page linked here can pass ?context= to
  // preselect the right subject (a broken-order link from checkout ->
  // order_purchase, an "I can't access my account" link -> account_access,
  // etc.) instead of making someone re-explain what they already told us
  // by clicking that specific link. Signed-in visitors get their name/
  // email prefilled from their account; a signed-out purchaser can still
  // arrive with ?email= carried over from their Stripe session.
  const reason = VALID_REASONS.has(searchParams.context ?? '') ? (searchParams.context as string) : 'general';
  const prefillName = session?.profile?.full_name ?? searchParams.name ?? '';
  const prefillEmail = session?.user.email ?? searchParams.email ?? '';

  return (
    <>
      <AuthHeader logoUrl={settings?.logo_url} />
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Get in Touch</h1>
          <p className="sub">
            Account access, an order or purchase issue, a masterclass date, or anything else — send it here
            and you&apos;ll hear back personally.
          </p>

          {searchParams.sent && (
            <div className="auth-notice">Message sent — you&apos;ll hear back personally soon.</div>
          )}
          {searchParams.error && <div className="auth-error">{searchParams.error}</div>}

          {!searchParams.sent && (
            <form action={submitContactMessage}>
              {/* Honeypot — invisible to real visitors, so anything that
                  fills it in is a bot; see actions.ts. */}
              <div style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
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
                <label htmlFor="reason">What&apos;s this about?</label>
                <select id="reason" name="reason" defaultValue={reason}>
                  {Object.entries(CONTACT_REASON_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" required rows={6} />
              </div>
              <button className="auth-submit" type="submit">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
