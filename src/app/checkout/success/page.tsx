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
 * Either way requires STRIPE_SECRET_KEY to be set — without it neither
 * this nor the webhook can reach Stripe at all, and a purchase just won't
 * show up.
 *
 * Whatever happens, the messaging here stays calm: Stripe already
 * confirmed the charge before this page ever loaded, so there's nothing
 * for the buyer to be uncertain about. No "still confirming" waiting
 * state, no refresh loop — either it's granted and shown, or it briefly
 * isn't yet and the copy says exactly that without hedging.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { product?: string; session_id?: string };
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

  async function heal(session: {
    id: string;
    customer: string | { id: string } | null;
    amount_total: number | null;
    currency: string | null;
    line_items?: { data: { price?: { id: string } | null }[] };
  }) {
    confirmationNumber = session.id;
    if (isActive) return;
    const priceIds = session.line_items?.data.map((li) => li.price?.id).filter(Boolean) as string[] | undefined;
    const matchedPriceId = priceIds?.find((id) => PRICE_TO_PRODUCT[id]);
    if (!matchedPriceId || PRICE_TO_PRODUCT[matchedPriceId] !== product) return;
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

  try {
    const stripe = getStripe();

    if (searchParams.session_id) {
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id, { expand: ['line_items'] });
      if (session.client_reference_id === user.id && session.payment_status === 'paid') {
        await heal(session);
      }
    }

    if (!isActive) {
      // No session_id on the URL (the Payment Link redirect wasn't set up
      // with one) or it didn't resolve — fall back to scanning this
      // account's own recent paid sessions instead of giving up.
      const recent = await stripe.checkout.sessions.list({ limit: 20 });
      for (const session of recent.data) {
        if (session.client_reference_id !== user.id || session.payment_status !== 'paid') continue;
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
        await heal({ ...session, line_items: lineItems });
        if (isActive) break;
      }
    }
  } catch (err) {
    console.error('[checkout success] Stripe verification unavailable:', err);
  }

  const copy = COPY[product];

  return (
    <>
      <AuthHeader />
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
              <h1>Payment received.</h1>
              <p className="sub">This will show up in your order history shortly.</p>
              <div style={{ marginTop: 24 }}>
                <Link href="/account" className="btn-ghost" style={{ textAlign: 'center' }}>
                  Go to Account
                </Link>
              </div>
            </>
          )}
          {confirmationNumber && (
            <p style={{ marginTop: 22, fontSize: 12.5, color: 'var(--muted-d)' }}>
              Confirmation #: <span style={{ fontFamily: 'monospace' }}>{confirmationNumber}</span>
              <br />
              Please save this for your records{!isActive && contactEmail ? ' — mention it if you reach out' : ''}.
            </p>
          )}
          {!isActive && contactEmail && (
            <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--muted-d)' }}>
              Questions in the meantime? <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
