import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';
import { getStripe } from '@/lib/stripe';
import { PRICE_TO_PRODUCT } from '@/lib/stripe-products';
import { grantEntitlement } from '@/lib/grant-entitlement';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const KNOWN_PRODUCTS = ['workshop_library', 'audit_room', 'scoped_engagement'] as const;
type Product = (typeof KNOWN_PRODUCTS)[number];

function isKnownProduct(value: string | undefined): value is Product {
  return Boolean(value) && (KNOWN_PRODUCTS as readonly string[]).includes(value!);
}

const COPY: Record<Product, { heading: string; body: string; cta: { href: string; label: string } }> = {
  workshop_library: {
    heading: "You're in.",
    body: 'Payment confirmed — the full Workshop Library, including the extended, less-edited sessions, is now available on your account.',
    cta: { href: '/library', label: 'Go to the Workshop Library' },
  },
  audit_room: {
    heading: "You're confirmed for The Audit Room.",
    body: "Payment confirmed — your seat is reserved. Session details (date, location or link) will show up on your account page as soon as they're set.",
    cta: { href: '/account', label: 'Go to Your Account' },
  },
  scoped_engagement: {
    heading: 'Deposit received.',
    body: "Your $2,000 deposit is confirmed and credited toward the total project fee. We'll reach out personally within one business day to scope the engagement and arrange payment for the remainder.",
    cta: { href: '/account', label: 'Go to Your Account' },
  },
};

function SuccessBadge() {
  return (
    <div className="success-badge">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ConfirmationFooter({
  confirmationNumber,
  visitorEmail,
  isActive,
}: {
  confirmationNumber: string | null;
  visitorEmail: string;
  isActive: boolean;
}) {
  const contactHref = `/contact?context=order_purchase${visitorEmail ? `&email=${encodeURIComponent(visitorEmail)}` : ''}`;
  return (
    <>
      {confirmationNumber && (
        <p style={{ marginTop: 22, fontSize: 12.5, color: 'var(--muted-d)' }}>
          Confirmation #: <span style={{ fontFamily: 'monospace' }}>{confirmationNumber}</span>
          <br />
          Please save this for your records{!isActive ? ' — mention it if you reach out' : ''}.
        </p>
      )}
      {!isActive && (
        <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--muted-d)' }}>
          Questions in the meantime?{' '}
          <Link href={contactHref} style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
            Contact us
          </Link>
        </p>
      )}
    </>
  );
}

/**
 * The async webhook that normally grants access can lag behind the
 * redirect (or not be configured at all yet) — so this page verifies the
 * purchase directly with Stripe itself and grants it in the same request
 * whenever the webhook hasn't:
 *
 *   1. If the Payment Link's "after payment" redirect carries
 *      `session_id={CHECKOUT_SESSION_ID}` (Stripe fills that in), look
 *      that exact session up.
 *   2. Otherwise (or if that lookup didn't pan out), scan this user's
 *      most recent paid checkout sessions for one matching this product —
 *      client_reference_id ties every session back to a signed-in user,
 *      so no session_id in the URL is actually required for this to work.
 *
 * A third case this now handles: nobody is signed in at all when this
 * page loads — either they paid via a Stripe link directly (bypassing the
 * usual sign-up-first gate somehow) or they're on a different browser
 * than the one they started on. Stripe itself always collects an email to
 * process the charge, independent of anything we set — so if we have a
 * verified paid session but no matching signed-in account, this offers a
 * "claim your purchase" step (sign in or create an account with that
 * email) instead of just bouncing to a bare login page with no context,
 * or worse, quietly leaving a paying customer with no way to ever access
 * what they bought.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { product?: string; session_id?: string };
}) {
  const session = await getSessionUser();
  const supabase = createClient();

  const product: Product = isKnownProduct(searchParams.product) ? searchParams.product : 'workshop_library';

  let isActive = false;
  let confirmationNumber: string | null = null;
  let claimEmail: string | null = null;
  // Only ever shown to a signed-in admin (see the render below) — this has
  // repeatedly been hard to diagnose blind (no access to Vercel logs or
  // the Stripe/Supabase dashboards from here), so surface exactly what
  // this request saw instead of guessing again next time it doesn't work.
  const diagnostics: string[] = [];
  const keyPrefix = process.env.STRIPE_SECRET_KEY?.slice(0, 8) ?? null;
  diagnostics.push(
    keyPrefix
      ? `STRIPE_SECRET_KEY is set (${keyPrefix.startsWith('sk_live') ? 'live mode' : keyPrefix.startsWith('sk_test') ? 'test mode' : 'unrecognized prefix: ' + keyPrefix}).`
      : 'STRIPE_SECRET_KEY is NOT set — nothing here or in the webhook can reach Stripe at all.'
  );
  diagnostics.push(`URL session_id param: ${searchParams.session_id ?? '(none)'}`);
  diagnostics.push(`Signed in as: ${session ? `${session.user.email} (${session.user.id})` : '(not signed in)'}`);
  diagnostics.push(
    `Price env vars: STRIPE_PRICE_WORKSHOP_LIBRARY=${process.env.STRIPE_PRICE_WORKSHOP_LIBRARY ?? '(unset)'}, STRIPE_PRICE_AUDIT_ROOM=${process.env.STRIPE_PRICE_AUDIT_ROOM ?? '(unset)'}, STRIPE_PRICE_SCOPED_ENGAGEMENT_DEPOSIT=${process.env.STRIPE_PRICE_SCOPED_ENGAGEMENT_DEPOSIT ?? '(unset)'}`
  );

  if (session) {
    const { data: entitlementRow } = await supabase
      .from('entitlements')
      .select('product, granted_at, status, stripe_checkout_session_id')
      .eq('user_id', session.user.id)
      .eq('product', product)
      .maybeSingle();
    isActive = Boolean(entitlementRow) && entitlementRow?.status !== 'revoked';
    confirmationNumber = entitlementRow?.stripe_checkout_session_id ?? null;
  }

  async function heal(stripeSession: {
    id: string;
    customer: string | { id: string } | null;
    amount_total: number | null;
    currency: string | null;
    line_items?: { data: { price?: { id: string } | null }[] };
  }) {
    confirmationNumber = stripeSession.id;
    if (isActive || !session) return;
    const priceIds = stripeSession.line_items?.data.map((li) => li.price?.id).filter(Boolean) as
      | string[]
      | undefined;
    const matchedPriceId = priceIds?.find((id) => PRICE_TO_PRODUCT[id]);
    if (!matchedPriceId || PRICE_TO_PRODUCT[matchedPriceId] !== product) return;
    const { error } = await grantEntitlement({
      userId: session.user.id,
      product,
      sessionId: stripeSession.id,
      customerId: typeof stripeSession.customer === 'string' ? stripeSession.customer : null,
      amountTotal: stripeSession.amount_total ?? null,
      currency: stripeSession.currency ?? null,
      source: 'checkout_success_selfheal',
      email: session.user.email ?? null,
    });
    if (!error) isActive = true;
    else console.error('[checkout success] self-heal grant failed:', error);
  }

  try {
    const stripe = getStripe();
    let verified: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>> | null = null;

    if (searchParams.session_id) {
      verified = await stripe.checkout.sessions.retrieve(searchParams.session_id, { expand: ['line_items'] });
      diagnostics.push(
        `Verified session ${verified.id}: payment_status=${verified.payment_status}, client_reference_id=${verified.client_reference_id ?? '(none)'}`
      );
    }

    if (session && verified && verified.client_reference_id === session.user.id && verified.payment_status === 'paid') {
      await heal(verified);
    }

    if (session && !isActive) {
      // No session_id on the URL (the Payment Link redirect wasn't set up
      // with one) or it didn't resolve — fall back to scanning this
      // account's own recent paid sessions instead of giving up.
      const recent = await stripe.checkout.sessions.list({ limit: 20 });
      const matchingSessions = recent.data.filter((s) => s.client_reference_id === session.user.id);
      diagnostics.push(
        `Scanned ${recent.data.length} most recent Stripe sessions (any account) — ${matchingSessions.length} had a client_reference_id matching this account.`
      );
      for (const s of recent.data) {
        if (s.client_reference_id !== session.user.id || s.payment_status !== 'paid') continue;
        const lineItems = await stripe.checkout.sessions.listLineItems(s.id, { limit: 5 });
        const priceIds = lineItems.data.map((li) => li.price?.id).filter(Boolean) as string[];
        diagnostics.push(
          `Session ${s.id} line item prices: ${priceIds.join(', ') || '(none)'} — known products: ${priceIds.map((id) => PRICE_TO_PRODUCT[id] ?? '(unrecognized price)').join(', ') || '(n/a)'}`
        );
        await heal({ ...s, line_items: lineItems });
        if (isActive) break;
      }
    }

    if (!session && verified && verified.payment_status === 'paid') {
      confirmationNumber = verified.id;
      claimEmail = verified.customer_details?.email ?? verified.customer_email ?? null;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    diagnostics.push(`Stripe call threw: ${message}`);
    console.error('[checkout success] Stripe verification unavailable:', err);
  }

  const { data: settings } = await supabase.from('site_settings').select('logo_url').eq('id', 'default').maybeSingle();
  const copy = COPY[product];

  // Signed out, but Stripe confirms a real paid session with an email —
  // offer to claim it instead of silently redirecting to a blank login
  // page with no memory of what just happened.
  if (!session && claimEmail && searchParams.session_id) {
    const claimToken = `claim:${product}:${searchParams.session_id}`;
    return (
      <>
        <AuthHeader logoUrl={settings?.logo_url} />
        <div className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: 140 }}>
          <div className="auth-card success-card" style={{ maxWidth: 480, textAlign: 'center' }}>
            <SuccessBadge />
            <h1>Payment received.</h1>
            <p className="sub">
              Paid with <strong>{claimEmail}</strong>. Sign in or create an account with that email to see this
              purchase in your order history.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              <Link
                href={`/signup?redirect=${encodeURIComponent(claimToken)}&email=${encodeURIComponent(claimEmail)}`}
                className="btn-primary"
                style={{ textAlign: 'center' }}
              >
                Create Account
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(claimToken)}&email=${encodeURIComponent(claimEmail)}`}
                className="btn-ghost"
                style={{ textAlign: 'center' }}
              >
                Sign In
              </Link>
            </div>
            <ConfirmationFooter confirmationNumber={confirmationNumber} visitorEmail={claimEmail ?? ''} isActive={false} />
          </div>
        </div>
      </>
    );
  }

  // Signed out, and no verifiable Stripe session to fall back on — nothing
  // safe to show; send to sign in rather than a dead end.
  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <AuthHeader logoUrl={settings?.logo_url} />
      <div className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: 140 }}>
        <div className={`auth-card${isActive ? ' success-card' : ''}`} style={{ maxWidth: 520, textAlign: 'center' }}>
          {isActive ? (
            <>
              <SuccessBadge />
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
              <h1>Payment received.</h1>
              <p className="sub">This will show up in your order history shortly.</p>
              <div style={{ marginTop: 24 }}>
                <Link href="/account" className="btn-ghost" style={{ textAlign: 'center' }}>
                  Go to Account
                </Link>
              </div>
            </>
          )}
          <ConfirmationFooter confirmationNumber={confirmationNumber} visitorEmail={session.user.email ?? ''} isActive={isActive} />
          {!isActive && session.profile?.role === 'admin' && (
            <div
              style={{
                marginTop: 24,
                textAlign: 'left',
                fontSize: 11.5,
                fontFamily: 'monospace',
                color: 'var(--muted-d)',
                background: 'rgba(0,0,0,.2)',
                border: '1px solid var(--line-d)',
                borderRadius: 4,
                padding: 14,
              }}
            >
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Admin-only diagnostics</div>
              {diagnostics.map((line, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
