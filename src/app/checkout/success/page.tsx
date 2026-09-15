import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KNOWN_PRODUCTS = ['workshop_library', 'audit_room', 'scoped_engagement'] as const;
type Product = (typeof KNOWN_PRODUCTS)[number];

function isKnownProduct(value: string | undefined): value is Product {
  return Boolean(value) && (KNOWN_PRODUCTS as readonly string[]).includes(value!);
}

const COPY: Record<Product, { emoji: string; heading: string; body: string; cta: { href: string; label: string } }> = {
  workshop_library: {
    emoji: '🎉',
    heading: "You're in.",
    body: 'Payment confirmed — the full Workshop Library, including the extended, less-edited sessions, just unlocked on your account.',
    cta: { href: '/library', label: 'Go to the Workshop Library' },
  },
  audit_room: {
    emoji: '🎉',
    heading: "You're confirmed for The Audit Room.",
    body: "Payment confirmed — your seat is reserved. Session details (date, location or link) will show up on your account page as soon as they're set.",
    cta: { href: '/account', label: 'Go to Your Account' },
  },
  scoped_engagement: {
    emoji: '✅',
    heading: 'Deposit received.',
    body: "Your $2,000 deposit is confirmed and credited toward the total project fee. We'll reach out personally within one business day to scope the engagement and arrange payment for the remainder.",
    cta: { href: '/account', label: 'Go to Your Account' },
  },
};

/**
 * Where each direct-checkout tier's Stripe Payment Link "after payment"
 * redirect should point (configured per-Payment-Link in the Stripe
 * Dashboard — can't be set via API from this environment):
 *   /checkout/success?product=workshop_library
 *   /checkout/success?product=audit_room
 *   /checkout/success?product=scoped_engagement
 *
 * We deliberately don't rely on any Stripe-supplied query param (like a
 * checkout session id) to decide what to show — the signed-in user's own
 * entitlement row is the source of truth, same as everywhere else in the
 * app. The webhook that grants it can lag a few seconds behind the
 * redirect, so if it hasn't landed yet we auto-refresh a few times (plain
 * <meta refresh>, no client JS needed) before falling back to a "check
 * your account shortly" message instead of spinning forever.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { check?: string; product?: string };
}) {
  const { user } = await requireUser();
  const supabase = createClient();

  const product: Product = isKnownProduct(searchParams.product) ? searchParams.product : 'workshop_library';

  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('product, granted_at, status')
    .eq('user_id', user.id)
    .eq('product', product)
    .maybeSingle();
  const isActive = Boolean(entitlement) && entitlement?.status !== 'revoked';

  const attempt = Number(searchParams.check ?? '0') || 0;
  const stillWaiting = !isActive && attempt < 4;
  const copy = COPY[product];

  return (
    <>
      <AuthHeader />
      {stillWaiting && (
        // eslint-disable-next-line @next/next/no-head-element
        <meta httpEquiv="refresh" content={`3;url=/checkout/success?product=${product}&check=${attempt + 1}`} />
      )}
      <div className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: 140 }}>
        <div className="auth-card" style={{ maxWidth: 520, textAlign: 'center' }}>
          {isActive ? (
            <>
              <div style={{ fontSize: 44, marginBottom: 6 }}>{copy.emoji}</div>
              <h1>{copy.heading}</h1>
              <p className="sub">{copy.body}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
                <Link href={copy.cta.href} className="btn-primary" style={{ textAlign: 'center' }}>
                  {copy.cta.label}
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
