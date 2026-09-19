import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, renderRsvpConfirmationEmail, getEmailBranding } from '@/lib/email';
import { buildCalendarInvite } from '@/lib/calendar-invite';
import type { CalendarSession } from '@/types/database';

/**
 * POST /api/rsvp { sessionId, fullName, email, phone }
 *
 * Moved server-side (rather than the client inserting into Supabase
 * directly, like the newsletter capture does) specifically so a
 * confirmation email can go out as part of the same request — that needs
 * a server-only API key, and it's the whole reason this exists: a
 * "Reserve a Free Seat" that never confirms anything isn't done.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId as string | undefined;
  const fullName = ((body?.fullName as string) ?? '').trim();
  const email = ((body?.email as string) ?? '').trim();
  const phone = ((body?.phone as string) ?? '').trim();
  const honeypot = ((body?.company as string) ?? '').trim();

  if (!sessionId || !email) {
    return NextResponse.json({ error: 'Missing sessionId/email' }, { status: 400 });
  }

  // Same honeypot posture as /contact: a bot that fills the hidden
  // "company" field gets a fake success instead of an error that would
  // just teach it to leave the field alone next time.
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient();

  const { data: session } = await supabase
    .from('calendar_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle<CalendarSession>();
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // The homepage card already hides the RSVP form once a session hits
  // capacity, but that's UI-only — nothing stopped a direct POST here
  // (or two people submitting the very last seat at the same moment)
  // from still getting in. This is the actual enforcement. Someone who
  // already has a seat can still "re-RSVP" past capacity (matches them,
  // not a new seat) — only a genuinely new signup is capacity-checked.
  if (session.capacity != null) {
    const [{ count }, { data: existing }] = await Promise.all([
      supabase
        .from('masterclass_rsvps')
        .select('id', { count: 'exact', head: true })
        .eq('calendar_session_id', sessionId),
      supabase.from('masterclass_rsvps').select('id').eq('calendar_session_id', sessionId).eq('email', email).maybeSingle(),
    ]);
    if (!existing && (count ?? 0) >= session.capacity) {
      return NextResponse.json({ error: 'full' }, { status: 409 });
    }
  }

  const { error } = await supabase.from('masterclass_rsvps').insert({
    calendar_session_id: sessionId,
    full_name: fullName,
    email,
    phone,
  });
  // A duplicate RSVP (same email, same session) isn't a real error from
  // the visitor's point of view — treat it the same as success, same
  // posture as the newsletter capture.
  if (error && !/duplicate|unique/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort — never fail the RSVP itself over an email hiccup.
  const branding = await getEmailBranding();
  const invite = buildCalendarInvite(session);
  await sendEmail({
    to: email,
    subject: `You're confirmed: ${session.topic}`,
    html: renderRsvpConfirmationEmail(session, branding),
    attachments: invite ? [{ filename: 'invite.ics', content: invite.icsBase64 }] : undefined,
  });

  return NextResponse.json({ ok: true });
}
