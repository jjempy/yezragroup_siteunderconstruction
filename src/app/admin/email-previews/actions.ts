'use server';

import { redirect } from 'next/navigation';
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

const SAMPLE_SESSION = {
  topic: 'Sample: The 5 Blind Spots That Are Quietly Costing You the Business You’re Building',
  date_text: 'Sample Date — 10:00 AM – 12:00 PM',
  location: '123 Sample Street, Sample City',
};

const SAMPLE_CONTACT_MSG = {
  name: 'Sample Visitor',
  email: 'sample-visitor@example.com',
  reason: 'general',
  message: 'This is a sample message body, sent to preview the real design and layout of this email.',
};

const EMAIL_TYPES = {
  rsvp_confirmation: {
    subject: 'TEST — You’re confirmed',
    render: (b: Awaited<ReturnType<typeof getEmailBranding>>) => renderRsvpConfirmationEmail(SAMPLE_SESSION, b),
  },
  rsvp_reminder: {
    subject: 'TEST — Tomorrow reminder',
    render: (b: Awaited<ReturnType<typeof getEmailBranding>>) => renderRsvpReminderEmail(SAMPLE_SESSION, b),
  },
  purchase_confirmation: {
    subject: 'TEST — Order confirmed',
    render: (b: Awaited<ReturnType<typeof getEmailBranding>>) =>
      renderPurchaseConfirmationEmail(
        { productLabel: 'Workshop Library — Lifetime Access', amountTotal: 14700, currency: 'usd' },
        b
      ),
  },
  contact_notification: {
    subject: 'TEST — New contact message',
    render: (b: Awaited<ReturnType<typeof getEmailBranding>>) => renderContactNotificationEmail(SAMPLE_CONTACT_MSG, b),
  },
  contact_ack: {
    subject: 'TEST — We’ve got your message',
    render: (b: Awaited<ReturnType<typeof getEmailBranding>>) => renderContactAckEmail(SAMPLE_CONTACT_MSG, b),
  },
} as const;

type EmailType = keyof typeof EMAIL_TYPES;

function isEmailType(value: string): value is EmailType {
  return value in EMAIL_TYPES;
}

/** Sends one real email — using sample data, clearly marked TEST in the
 * subject — to the admin address on file (site_settings.contact_email),
 * so a design/branding tweak can be checked in a real inbox without
 * waiting for a real RSVP, purchase, or contact submission to trigger it
 * naturally. Admin-only; never touches real data. */
export async function sendTestEmail(formData: FormData) {
  await requireAdmin();
  const type = formData.get('type') as string;
  if (!isEmailType(type)) {
    redirect('/admin/email-previews?error=Unknown+email+type');
  }

  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('contact_email')
    .eq('id', 'default')
    .maybeSingle();
  const to = settings?.contact_email;
  if (!to) {
    redirect(
      '/admin/email-previews?error=' +
        encodeURIComponent('No admin email on file — set Contact Email in Admin → Hero & About first.')
    );
  }

  const branding = await getEmailBranding();
  const { subject, render } = EMAIL_TYPES[type];
  const { sent } = await sendEmail({ to, subject, html: render(branding) });

  if (!sent) {
    redirect(
      '/admin/email-previews?error=' +
        encodeURIComponent('Send failed — check RESEND_API_KEY/RESEND_FROM_EMAIL are set and redeployed.')
    );
  }

  redirect(`/admin/email-previews?sent=${type}`);
}
