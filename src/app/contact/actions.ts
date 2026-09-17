'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, renderContactNotificationEmail, renderContactAckEmail } from '@/lib/email';

function failure(message: string): never {
  redirect(`/contact?error=${encodeURIComponent(message)}`);
}

/** Public, no-login contact form — same posture as the newsletter/RSVP
 * forms (anyone can insert, only admins can read it back). A hidden
 * "company" field is a honeypot: real visitors never see or fill it, so
 * anything that arrives with it set is a bot and gets silently dropped
 * without an error that would just teach the bot to adjust. */
export async function submitContactMessage(formData: FormData) {
  const honeypot = ((formData.get('company') as string) ?? '').trim();
  const name = ((formData.get('name') as string) ?? '').trim();
  const email = ((formData.get('email') as string) ?? '').trim();
  const reason = ((formData.get('reason') as string) ?? 'general').trim();
  const message = ((formData.get('message') as string) ?? '').trim();

  if (honeypot) {
    redirect('/contact?sent=1');
  }
  if (!name || !email || !message) {
    failure('Please fill in your name, email, and message.');
  }

  const supabase = createClient();
  const { error } = await supabase.from('contact_messages').insert({ name, email, reason, message });
  if (error) {
    failure(`Couldn't send: ${error.message}`);
  }

  const { data: settings } = await supabase
    .from('site_settings')
    .select('contact_email')
    .eq('id', 'default')
    .maybeSingle();

  // Best-effort — never fail the submission itself over an email hiccup;
  // it's already safely recorded in contact_messages either way.
  if (settings?.contact_email) {
    await sendEmail({
      to: settings.contact_email,
      subject: `New contact message — ${name}`,
      html: renderContactNotificationEmail({ name, email, reason, message }),
      replyTo: email,
    });
  }
  await sendEmail({
    to: email,
    subject: "We've got your message",
    html: renderContactAckEmail({ name }),
  });

  redirect('/contact?sent=1');
}
