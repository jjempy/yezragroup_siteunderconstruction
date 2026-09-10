import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/checkout/workshop-library
 *
 * Entry point for the $147 Workshop Library rung's CTA. Signed-out
 * visitors are sent to sign up first; signed-in visitors are bounced
 * straight to the Stripe Payment Link with client_reference_id set to
 * their user id, so the webhook can grant the entitlement to the right
 * account without ever trusting the client.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signupUrl = new URL('/signup', req.url);
    signupUrl.searchParams.set('redirect', 'checkout');
    return NextResponse.redirect(signupUrl);
  }

  const { data: settings } = await supabase
    .from('site_settings')
    .select('stripe_workshop_library_url')
    .eq('id', 'default')
    .maybeSingle();

  if (!settings?.stripe_workshop_library_url) {
    const home = new URL('/#ladder', req.url);
    return NextResponse.redirect(home);
  }

  const target = new URL(settings.stripe_workshop_library_url);
  target.searchParams.set('client_reference_id', user.id);
  if (user.email) target.searchParams.set('prefilled_email', user.email);

  return NextResponse.redirect(target);
}
