import { NextResponse, type NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { PRICE_TO_PRODUCT } from '@/lib/stripe-products';
import { grantEntitlement } from '@/lib/grant-entitlement';

// Stripe webhooks must read the raw request body to verify the signature —
// don't let Next parse it as JSON.
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[stripe webhook] signature verification failed:', message);
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      client_reference_id: string | null;
      customer: string | null;
      payment_status: string;
      amount_total: number | null;
      currency: string | null;
    };

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: 'not paid' });
    }

    const userId = session.client_reference_id;
    if (!userId) {
      // No signed-in user was attached to this checkout (shouldn't happen via
      // our own /api/checkout/* routes, but guard anyway).
      console.warn('[stripe webhook] checkout.session.completed with no client_reference_id', session.id);
      return NextResponse.json({ received: true, skipped: 'no client_reference_id' });
    }

    // Which product did they actually buy? Match the purchased price
    // against every known tier rather than assuming — this is what lets
    // one webhook endpoint serve every direct-checkout tier (Workshop
    // Library, Audit Room, the Scoped Engagement deposit, and whatever's
    // added later) instead of one endpoint per product.
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    const matchedPriceId = lineItems.data.find((li) => li.price?.id && PRICE_TO_PRODUCT[li.price.id])?.price?.id;
    const product = matchedPriceId ? PRICE_TO_PRODUCT[matchedPriceId] : null;

    if (!product) {
      console.warn('[stripe webhook] checkout.session.completed for an unrecognized price', session.id);
      return NextResponse.json({ received: true, skipped: 'price not recognized' });
    }

    const { error } = await grantEntitlement({
      userId,
      product,
      sessionId: session.id,
      customerId: typeof session.customer === 'string' ? session.customer : null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      source: 'stripe_webhook',
    });

    if (error) {
      console.error('[stripe webhook] failed to write entitlement:', error);
      return NextResponse.json({ error: 'Failed to record entitlement' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
