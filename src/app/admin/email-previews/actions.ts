'use server';

import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  sendEmail,
  getEmailBranding,
  renderRsvpConfirmationEmail,
  renderRsvpReminderEmail,
  renderPurchaseConfirmationEmail,
  renderContactNotificationEmail,
  renderContactAckEmail,
} from '@/lib/email';
import { buildCalendarInvite } from '@/lib/calendar-invite';

const SAMPLE_CONTACT_MSG = {
  name: 'Sample Visitor',
  email: 'sample-visitor@example.com',
  reason: 'general',
  message: 'This is a sample message body, sent to preview the real design and layout of this email.',
};

const EMAIL_TYPE_KEYS = ['rsvp_confirmation', 'rsvp_reminder', 'purchase_confirmation', 'contact_notification', 'contact_ack'] as const;
type EmailType = (typeof EMAIL_TYPE_KEYS)[number];

function isEmailType(value: string): value is EmailType {
  return (EMAIL_TYPE_KEYS as readonly string[]).includes(value);
}

// Built fresh on every send, not as a module-level constant — this ran
// once at cold start and then got reused for however long that server
// instance stayed warm (hours, sometimes), so "tomorrow" silently went
// stale and a test invite could land on the wrong day depending purely
// on when the server last restarted, not when the test was actually sent.
function buildEmailTypes(branding: Awaited<ReturnType<typeof getEmailBranding>>) {
  const sampleSession = {
    id: 'sample-session-id',
    topic: 'SAMPLE DATA — The 5 Blind Spots That Are Quietly Costing You the Business You’re Building',
    date_text: 'SAMPLE DATE — Not a real session',
    location: 'SAMPLE ADDRESS — 123 Placeholder St, Placeholder City',
    session_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    start_time: '10:00',
    end_time: '12:00',
  };
  const invite = buildCalendarInvite(sampleSession);
  const sampleAttachments = invite ? [{ filename: 'invite.ics', content: invite.icsBase64 }] : undefined;

  return {
    rsvp_confirmation: {
      subject: 'TEST — You’re confirmed',
      html: renderRsvpConfirmationEmail(sampleSession, branding),
      attachments: sampleAttachments,
    },
    rsvp_reminder: {
      subject: 'TEST — Tomorrow reminder',
      html: renderRsvpReminderEmail(sampleSession, branding),
      attachments: sampleAttachments,
    },
    purchase_confirmation: {
      subject: 'TEST — Order confirmed',
      html: renderPurchaseConfirmationEmail(
        { productLabel: 'Workshop Library — Lifetime Access', amountTotal: 14700, currency: 'usd' },
        branding
      ),
      attachments: undefined as { filename: string; content: string }[] | undefined,
    },
    contact_notification: {
      subject: 'TEST — New contact message',
      html: renderContactNotificationEmail(SAMPLE_CONTACT_MSG, branding),
      attachments: undefined as { filename: string; content: string }[] | undefined,
    },
    contact_ack: {
      subject: 'TEST — We’ve got your message',
      html: renderContactAckEmail(SAMPLE_CONTACT_MSG, branding),
      attachments: undefined as { filename: string; content: string }[] | undefined,
    },
  } satisfies Record<EmailType, { subject: string; html: string; attachments?: { filename: string; content: string }[] }>;
}

export type SendTestEmailState = { ok: boolean; message: string } | null;

/** Sends one real email — using sample data, clearly marked TEST in the
 * subject — to the admin address on file (site_settings.contact_email),
 * so a design/branding tweak can be checked in a real inbox without
 * waiting for a real RSVP, purchase, or contact submission to trigger it
 * naturally. Admin-only; never touches real data.
 *
 * Returns a result instead of redirecting (used with useFormState) so
 * the button can show an inline "Sent" confirmation without a full page
 * navigation resetting every other button's state. */
export async function sendTestEmail(_prev: SendTestEmailState, formData: FormData): Promise<SendTestEmailState> {
  await requireAdmin();
  const type = formData.get('type') as string;
  if (!isEmailType(type)) {
    return { ok: false, message: 'Unknown email type.' };
  }

  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('contact_email')
    .eq('id', 'default')
    .maybeSingle();
  const to = settings?.contact_email;
  if (!to) {
    return { ok: false, message: 'No admin email on file — set Contact Email in Admin → Hero & About first.' };
  }

  const branding = await getEmailBranding();
  const { subject, html, attachments } = buildEmailTypes(branding)[type];
  const { sent } = await sendEmail({ to, subject, html, attachments });

  if (!sent) {
    return { ok: false, message: 'Send failed — check RESEND_API_KEY/RESEND_FROM_EMAIL are set and redeployed.' };
  }

  return { ok: true, message: 'Sent!' };
}
