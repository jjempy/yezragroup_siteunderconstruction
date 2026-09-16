import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';

/**
 * Shared entry-point logic for every direct-checkout tier: signed-out
 * visitors go sign up first; signed-in visitors get bounced to the Stripe
 * Payment Link with client_reference_id set to their Supabase user id (and
 * their email prefilled), so the webhook can always tie the purchase back
 * to an account — never a client-side flag. `urlField` is whichever
 * site_settings column holds that tier's Payment Link URL.
 */
export async function redirectToCheckout(
  req: NextRequest,
  product: 'workshop_library' | 'audit_room' | 'scoped_engagement',
  urlField: keyof SiteSettings
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Carries which tier to resume into after signup/login/email
    // confirmation — see src/lib/checkoutPaths.ts. Without this, every
    // signed-out visitor buying ANY tier got funneled back to Workshop
    // Library specifically once there was more than one direct-checkout
    // product.
    const signupUrl = new URL('/signup', req.url);
    signupUrl.searchParams.set('redirect', product);
    return NextResponse.redirect(signupUrl);
  }

  const { data: settings } = await supabase
    .from('site_settings')
    .select(urlField)
    .eq('id', 'default')
    .maybeSingle<Pick<SiteSettings, typeof urlField>>();

  const paymentLinkUrl = settings?.[urlField] as string | undefined;
  if (!paymentLinkUrl) {
    return NextResponse.redirect(new URL('/#ladder', req.url));
  }

  // A malformed value here (missing "https://", a pasted Dashboard link
  // instead of a Payment Link, stray whitespace) used to crash this route
  // outright — `new URL()` throws on anything that isn't a real absolute
  // URL, and nothing caught it. Falling back to the ladder section (with
  // a clear server log naming exactly which field/value was bad) means a
  // bad paste in Admin -> Ladder Tiers degrades to "the button doesn't
  // work yet" instead of a crash page.
  let target: URL;
  try {
    target = new URL(paymentLinkUrl);
  } catch {
    console.error(
      `[checkout] site_settings.${urlField} isn't a valid URL: ${JSON.stringify(paymentLinkUrl)}`
    );
    return NextResponse.redirect(new URL('/#ladder', req.url));
  }
  target.searchParams.set('client_reference_id', user.id);
  if (user.email) target.searchParams.set('prefilled_email', user.email);

  return NextResponse.redirect(target);
}
