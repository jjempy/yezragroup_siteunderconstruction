import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/newsletter { email, company }
 *
 * Newsletter signup used to insert into Supabase directly from the
 * browser — fine for a real visitor, but it meant there was no server
 * code in the loop to ever check anything, so a honeypot field would
 * have been checked client-side only. A scripted bot that ignores our JS
 * and just calls the anon REST endpoint with the same insert-anyone RLS
 * policy would sail straight past a client-only check. Routing through a
 * route handler (same posture as /contact and /api/rsvp) makes the
 * honeypot check real.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = ((body?.email as string) ?? '').trim();
  const honeypot = ((body?.company as string) ?? '').trim();

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient();
  const { error } = await supabase.from('newsletter_signups').insert({ email, source: 'homepage' });
  // A duplicate email (already signed up) isn't a real error from the
  // visitor's point of view — treat it the same as success.
  if (error && !/duplicate|unique/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
