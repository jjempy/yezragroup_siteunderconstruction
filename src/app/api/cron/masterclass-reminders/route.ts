import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, renderRsvpReminderEmail } from '@/lib/email';
import type { CalendarSession, MasterclassRsvp } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/masterclass-reminders
 *
 * Runs daily (see vercel.json) and emails a reminder to everyone RSVP'd
 * for a session happening tomorrow, skipping anyone already reminded
 * (reminder_sent_at) so a double-fire or a re-run never double-sends.
 *
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on its
 * own scheduled invocations when CRON_SECRET is set in the environment —
 * checked here so this endpoint (otherwise a public GET route) can't be
 * triggered by anyone else. If CRON_SECRET isn't set yet, the check is
 * skipped with a warning rather than silently never sending reminders.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron:masterclass-reminders] CRON_SECRET not set — endpoint is unauthenticated');
  }

  const admin = createAdminClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const { data: sessions } = await admin
    .from('calendar_sessions')
    .select('*')
    .eq('session_date', tomorrowStr);

  let sent = 0;
  for (const session of (sessions as CalendarSession[]) ?? []) {
    const { data: rsvps } = await admin
      .from('masterclass_rsvps')
      .select('*')
      .eq('calendar_session_id', session.id)
      .is('reminder_sent_at', null);

    for (const rsvp of (rsvps as MasterclassRsvp[]) ?? []) {
      const { sent: ok } = await sendEmail({
        to: rsvp.email,
        subject: `Tomorrow: ${session.topic}`,
        html: renderRsvpReminderEmail(session),
      });
      if (ok) {
        await admin
          .from('masterclass_rsvps')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', rsvp.id);
        sent += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, sessionsChecked: sessions?.length ?? 0, remindersSent: sent });
}
