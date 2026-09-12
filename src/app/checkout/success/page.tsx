import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Where the Stripe Payment Link's "after payment" redirect should point
 * (configured in the Stripe Dashboard — Payment Links can't be set via API
 * from this environment). We deliberately don't rely on any Stripe-supplied
 * query param (like a checkout session id) to decide what to show — the
 * signed-in user's own entitlement row is the source of truth, same as
 * everywhere else in the app.
 *
 * The webhook that grants the entitlement can lag a few seconds behind the
 * redirect, so if it hasn't landed yet we auto-refresh a few times (plain
 * <meta refresh>, no client JS needed) before falling back to a "check your
 * account shortly" message instead of spinning forever.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { check?: string };
}) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('product, granted_at')
    .eq('user_id', user.id)
    .eq('product', 'workshop_library')
    .maybeSingle();

  const attempt = Number(searchParams.check ?? '0') || 0;
  const stillWaiting = !entitlement && attempt < 4;

  return (
    <>
      <AuthHeader />
      {stillWaiting && (
        // eslint-disable-next-line @next/next/no-head-element
        <meta httpEquiv="refresh" content={`3;url=/checkout/success?check=${attempt + 1}`} />
      )}
      <div className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: 140 }}>
        <div className="auth-card" style={{ maxWidth: 520, textAlign: 'center' }}>
          {entitlement ? (
            <>
              <div style={{ fontSize: 44, marginBottom: 6 }}>🎉</div>
              <h1>You&apos;re in.</h1>
              <p className="sub">
                Payment confirmed — the full Workshop Library, including the extended, less-edited
                sessions, just unlocked on your account.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
                <Link href="/library" className="btn-primary" style={{ textAlign: 'center' }}>
                  Go to the Workshop Library
                </Link>
                <Link href="/account#orders" className="btn-ghost" style={{ textAlign: 'center' }}>
                  View Order History &amp; Account
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 44, marginBottom: 6 }}>✅</div>
              <h1>Payment received</h1>
              <p className="sub">
                {stillWaiting
                  ? 'Confirming this with Stripe — just a moment…'
                  : 'This is taking a little longer than usual to confirm. Your access will show up on your Account page the moment it lands — no need to pay again.'}
              </p>
              <div style={{ marginTop: 24 }}>
                <Link href="/account" className="btn-ghost" style={{ textAlign: 'center' }}>
                  Check Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
