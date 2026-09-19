'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  sendEmail,
  renderVipApplicationNotificationEmail,
  renderVipApplicationAckEmail,
  getEmailBranding,
} from '@/lib/email';
import { normalizePhone } from '@/lib/phone';

function failure(message: string): never {
  redirect(`/apply-vip?error=${encodeURIComponent(message)}`);
}

const VALID_REFERRAL_SOURCES = new Set(['scoped_engagement', 'masterclass', 'referred', 'other']);
const VALID_ANNUAL_REVENUE = new Set(['under_500k', '500k_1m', '1m_3m', '3m_5m', '5m_10m', 'over_10m']);

/** Public, no-login VIP application form — same posture as /contact
 * (anyone can insert, only admins can read it back). Replaces the old
 * external Tally/Google Form link, which was broken on the live site
 * (see site-data.ts's resolveTierHref). The honeypot field is named
 * "website" rather than "company" here, since Company is a real,
 * legitimate field on this particular form. */
export async function submitVipApplication(formData: FormData) {
  const honeypot = ((formData.get('website') as string) ?? '').trim();
  const name = ((formData.get('name') as string) ?? '').trim();
  const email = ((formData.get('email') as string) ?? '').trim();
  const phoneRaw = ((formData.get('phone') as string) ?? '').trim();
  const company = ((formData.get('company') as string) ?? '').trim();
  const message = ((formData.get('message') as string) ?? '').trim();
  const referralSourceRaw = ((formData.get('referral_source') as string) ?? 'other').trim();
  const referralSource = VALID_REFERRAL_SOURCES.has(referralSourceRaw) ? referralSourceRaw : 'other';
  const referredBy = ((formData.get('referred_by') as string) ?? '').trim();
  const annualRevenueRaw = ((formData.get('annual_revenue') as string) ?? '').trim();

  if (honeypot) {
    redirect('/apply-vip?sent=1');
  }
  if (!name || !email || !message) {
    failure('Please fill in your name, email, and a bit about what you want to work through.');
  }
  if (!phoneRaw) {
    failure('Phone number is required.');
  }
  const { value: phone, valid: phoneValid } = normalizePhone(phoneRaw);
  if (!phoneValid || !phone) {
    failure("That phone number doesn't look right — check the area code and digits.");
  }
  if (!VALID_ANNUAL_REVENUE.has(annualRevenueRaw)) {
    failure('Please select an annual revenue range.');
  }
  if (referralSource === 'referred' && !referredBy) {
    failure('Please tell us who referred you.');
  }

  const supabase = createClient();
  const { error } = await supabase.from('vip_applications').insert({
    name,
    email,
    phone,
    company,
    message,
    referral_source: referralSource,
    referred_by: referralSource === 'referred' ? referredBy : '',
    annual_revenue: annualRevenueRaw,
  });
  if (error) {
    failure(`Couldn't submit: ${error.message}`);
  }

  const { data: settings } = await supabase
    .from('site_settings')
    .select('contact_email')
    .eq('id', 'default')
    .maybeSingle();

  // Best-effort — never fail the submission itself over an email hiccup;
  // it's already safely recorded in vip_applications either way.
  const branding = await getEmailBranding();
  if (settings?.contact_email) {
    await sendEmail({
      to: settings.contact_email,
      subject: `New VIP application — ${name}`,
      html: renderVipApplicationNotificationEmail(
        { name, email, phone, company, message, referralSource, referredBy, annualRevenue: annualRevenueRaw },
        branding
      ),
      replyTo: email,
    });
  }
  await sendEmail({
    to: email,
    subject: 'Your VIP application',
    html: renderVipApplicationAckEmail({ name }, branding),
  });

  redirect('/apply-vip?sent=1');
}
