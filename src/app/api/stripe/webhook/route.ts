import { NextResponse, type NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

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
      line_items?: { data: Array<{ price?: { id: string } | null }> };
    };

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: 'not paid' });
    }

    const userId = session.client_reference_id;
    if (!userId) {
      // No signed-in user was attached to this checkout (shouldn't happen via
      // our own /api/checkout/workshop-library flow, but guard anyway).
      console.warn('[stripe webhook] checkout.session.completed with no client_reference_id', session.id);
      return NextResponse.json({ received: true, skipped: 'no client_reference_id' });
    }

    // Confirm the purchased price matches the Workshop Library price, so a
    // future second Payment Link on the same Stripe account can't
    // accidentally grant this entitlement.
    const priceId = process.env.STRIPE_PRICE_WORKSHOP_LIBRARY;
    if (priceId) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
      const matches = lineItems.data.some((li) => li.price?.id === priceId);
      if (!matches) {
        return NextResponse.json({ received: true, skipped: 'price mismatch' });
      }
    }

    const supabase = createAdminClient();
    const grant: Record<string, unknown> = {
      user_id: userId,
      product: 'workshop_library',
      stripe_checkout_session_id: session.id,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
      source: 'stripe_webhook',
    };

    let { error } = await supabase.from('entitlements').upsert(grant, { onConflict: 'user_id,product' });

    // Granting access is the one thing this webhook must never fail to do
    // — if the 0008 migration (amount_total/currency columns) hasn't been
    // run against this Supabase project yet, don't let that block the
    // actual purchase from being honored. Retry with just the columns that
    // are guaranteed to exist; the order-history $ amount can backfill
    // later, but the customer's access can't wait on a migration.
    if (error && error.message.includes('column') && error.message.includes('schema cache')) {
      console.warn('[stripe webhook] amount_total/currency columns missing (run 0008 migration) — retrying core grant only');
      delete grant.amount_total;
      delete grant.currency;
      ({ error } = await supabase.from('entitlements').upsert(grant, { onConflict: 'user_id,product' }));
    }

    if (error) {
      console.error('[stripe webhook] failed to write entitlement:', error.message);
      return NextResponse.json({ error: 'Failed to record entitlement' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
