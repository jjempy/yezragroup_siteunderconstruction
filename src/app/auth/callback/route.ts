import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkoutPathFor } from '@/lib/checkoutPaths';

/**
 * Handles the redirect from a Supabase email confirmation link
 * (`emailRedirectTo` in signUp). Exchanges the `code` for a session, then
 * sends the user on — either into the Stripe checkout flow they started
 * signup for, or back to the homepage.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const redirect = req.nextUrl.searchParams.get('redirect');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const target = checkoutPathFor(redirect);
  return NextResponse.redirect(new URL(target, req.url));
}
