import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, renderRsvpReminderEmail, getEmailBranding } from '@/lib/email';
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
 * own scheduled invocations, once an env var literally named CRON_SECRET
 * exists in this project — that exact name is a Vercel platform
 * convention, not something this code chose or can rename per-cron (a
 * differently-named secret would never get sent automatically, silently
 * breaking the real daily run). Checked here so this otherwise-public GET
 * route can't be triggered or scraped by anyone else. Required, not
 * optional: a missing secret fails closed (401/500) instead of quietly
 * running unauthenticated.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron:masterclass-reminders] CRON_SECRET not set — refusing to run');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const branding = await getEmailBranding();

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
        html: renderRsvpReminderEmail(session, branding),
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
