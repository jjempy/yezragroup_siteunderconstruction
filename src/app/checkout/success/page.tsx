import Link from 'next/link';
import { requireUser } from '@/lib/auth';
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

const COPY: Record<Product, { emoji: string; heading: string; body: string; cta: { href: string; label: string } }> = {
  workshop_library: {
    emoji: '🎉',
    heading: "You're in.",
    body: 'Payment confirmed — the full Workshop Library, including the extended, less-edited sessions, is now available on your account.',
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
 * app.
 *
 * The webhook that grants it can lag a little behind the redirect, so
 * this waits once (a single auto-refresh after a few seconds — not a
 * repeated reload loop, which just reads as broken) before settling into
 * a calm, static "here's what to do" state. Deliberately no "go check
 * your account" button while still waiting — showing an action alongside
 * "please wait" was sending two contradictory signals at once.
 *
 * If the Payment Link's "after payment" redirect includes
 * `session_id={CHECKOUT_SESSION_ID}` (Stripe fills that placeholder in
 * automatically), this page verifies the session directly with Stripe and
 * grants the entitlement itself in the same request — so a purchase shows
 * up immediately even if the async webhook is slow, misconfigured, or
 * never fires at all. That session id also becomes the confirmation
 * number shown below, so there's a paper trail even if the confirmation
 * email never sends.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { check?: string; product?: string; session_id?: string };
}) {
  const { user } = await requireUser();
  const supabase = createClient();

  const product: Product = isKnownProduct(searchParams.product) ? searchParams.product : 'workshop_library';

  const [{ data: entitlementRow }, { data: settings }] = await Promise.all([
    supabase
      .from('entitlements')
      .select('product, granted_at, status, stripe_checkout_session_id')
      .eq('user_id', user.id)
      .eq('product', product)
      .maybeSingle(),
    supabase.from('site_settings').select('contact_email').eq('id', 'default').maybeSingle(),
  ]);
  let isActive = Boolean(entitlementRow) && entitlementRow?.status !== 'revoked';
  const contactEmail = settings?.contact_email || '';
  let confirmationNumber: string | null = entitlementRow?.stripe_checkout_session_id ?? null;

  if (searchParams.session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id, {
        expand: ['line_items'],
      });
      if (session.client_reference_id === user.id && session.payment_status === 'paid') {
        confirmationNumber = session.id;
        if (!isActive) {
          const matchedPriceId = session.line_items?.data.find(
            (li) => li.price?.id && PRICE_TO_PRODUCT[li.price.id]
          )?.price?.id;
          const matchedProduct = matchedPriceId ? PRICE_TO_PRODUCT[matchedPriceId] : null;
          if (matchedProduct === product) {
            const { error } = await grantEntitlement({
              userId: user.id,
              product,
              sessionId: session.id,
              customerId: typeof session.customer === 'string' ? session.customer : null,
              amountTotal: session.amount_total ?? null,
              currency: session.currency ?? null,
              source: 'checkout_success_selfheal',
            });
            if (!error) isActive = true;
            else console.error('[checkout success] self-heal grant failed:', error);
          }
        }
      }
    } catch (err) {
      console.error('[checkout success] session verification failed:', err);
    }
  }

  const attempt = Number(searchParams.check ?? '0') || 0;
  const stillWaiting = !isActive && attempt < 1;
  const gaveUp = !isActive && !stillWaiting;
  const copy = COPY[product];

  return (
    <>
      <AuthHeader />
      {stillWaiting && (
        // A single retry after a few seconds — plenty of time for the
        // webhook to land in the overwhelming majority of cases, without
        // the flickering repeated-reload feel of polling every 3 seconds.
        // eslint-disable-next-line @next/next/no-head-element
        <meta httpEquiv="refresh" content={`5;url=/checkout/success?product=${product}&check=1`} />
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
              {confirmationNumber && (
                <p style={{ marginTop: 22, fontSize: 12.5, color: 'var(--muted-d)' }}>
                  Confirmation #: <span style={{ fontFamily: 'monospace' }}>{confirmationNumber}</span>
                  <br />
                  Please save this for your records.
                </p>
              )}
            </>
          ) : stillWaiting ? (
            <>
              <h1>Payment received.</h1>
              <p className="sub">Confirming this now — this page will update in a few seconds.</p>
              {confirmationNumber && (
                <p style={{ marginTop: 18, fontSize: 12.5, color: 'var(--muted-d)' }}>
                  Confirmation #: <span style={{ fontFamily: 'monospace' }}>{confirmationNumber}</span>
                  <br />
                  Please save this for your records.
                </p>
              )}
            </>
          ) : (
            <>
              <h1>Payment received.</h1>
              <p className="sub">
                Confirming this is taking longer than usual. Your card was charged and nothing needs to be
                paid again — this will show up on your account shortly.
                {contactEmail && (
                  <>
                    {' '}
                    If it hasn&apos;t within a few minutes, email{' '}
                    <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and it&apos;ll get sorted out.
                  </>
                )}
              </p>
              {confirmationNumber && (
                <p style={{ marginTop: 18, fontSize: 12.5, color: 'var(--muted-d)' }}>
                  Confirmation #: <span style={{ fontFamily: 'monospace' }}>{confirmationNumber}</span>
                  <br />
                  Please save this for your records{contactEmail ? ' and include it in that email' : ''}.
                </p>
              )}
              <div style={{ marginTop: 24 }}>
                <Link href="/account" className="btn-ghost" style={{ textAlign: 'center' }}>
                  Go to Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
