import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { AuthHeader } from '@/components/AuthHeader';
import { VipApplicationForm } from '@/components/VipApplicationForm';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PAGE_URL = 'https://orchemet.com/apply-vip';
const PAGE_TITLE = 'Apply for VIP';
const PAGE_DESCRIPTION = 'Application for the VIP Intensive — reviewed personally, not open checkout.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: PAGE_URL },
  openGraph: { url: PAGE_URL, title: PAGE_TITLE, description: PAGE_DESCRIPTION },
  twitter: { title: PAGE_TITLE, description: PAGE_DESCRIPTION },
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

          {!searchParams.sent && <VipApplicationForm prefillName={prefillName} prefillEmail={prefillEmail} />}
        </div>
      </div>
    </>
  );
}
