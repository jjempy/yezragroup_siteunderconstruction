import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session for the signed-in user and
 * redirects them into it. Forward-looking: today's tiers are one-time
 * purchases with nothing to manage, but this is wired up now so a future
 * subscription tier (e.g. a recurring membership) works immediately —
 * configure the portal's cancellation-reason survey in the Stripe
 * Dashboard under Settings → Billing → Customer portal.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const admin = createAdminClient();
  const { data: entitlement } = await admin
    .from('entitlements')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!entitlement?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No Stripe customer on file yet — make a purchase first.' },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: entitlement.stripe_customer_id,
    return_url: new URL('/account', req.url).toString(),
  });

  return NextResponse.redirect(portalSession.url, { status: 303 });
}
