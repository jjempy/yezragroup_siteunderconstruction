import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { buildCalendarInvite, type CalendarInviteInput } from '@/lib/calendar-invite';

/**
 * Thin wrapper over Resend's REST API (no SDK — one fetch call, no new
 * dependency to version-pin). Requires RESEND_API_KEY and
 * RESEND_FROM_EMAIL in the server environment; if either is missing this
 * logs and no-ops rather than throwing, so a missing/misconfigured email
 * provider can never block the actual action (an RSVP, a purchase) it's
 * attached to — see every call site.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY/RESEND_FROM_EMAIL not set — skipping send:', subject);
    return { sent: false };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(attachments?.length ? { attachments } : {}),
      }),
    });
    if (!res.ok) {
      console.error('[email] send failed:', res.status, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] send threw:', err);
    return { sent: false };
  }
}

/** Fire-and-forget alert to the admin contact address for the handful of
 * failure states where Stripe has already taken someone's money but our
 * own bookkeeping didn't happen (entitlement write failed, or a paid
 * checkout couldn't be matched to a known product/account) — the one
 * category of bug that costs real revenue if it goes unnoticed, and
 * previously only surfaced as a console.error nobody was watching. Reuses
 * the existing Resend setup rather than adding a new monitoring service —
 * never throws, since a failed alert must never mask the original error. */
export async function sendAdminAlert(subject: string, details: Record<string, string | null>): Promise<void> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from('site_settings').select('contact_email').eq('id', 'default').maybeSingle();
    const to = data?.contact_email;
    if (!to) {
      console.warn('[alert] site_settings.contact_email is empty — cannot send alert:', subject);
      return;
    }
    const rows = Object.entries(details)
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${k}</td><td>${v ?? '—'}</td></tr>`)
      .join('');
    await sendEmail({
      to,
      subject: `[Orchemet Alert] ${subject}`,
      html: `<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;"><h2 style="margin:0 0 12px;">${subject}</h2><table>${rows}</table></div>`,
    });
  } catch (err) {
    console.error('[alert] sendAdminAlert threw:', err);
  }
}

export interface EmailBranding {
  brandName: string;
  logoUrl: string | null;
  emailLogoUrl: string | null;
  ink: string;
  cream: string;
  gold: string;
}

const SITE_URL = 'https://orchemet.com';

const DEFAULT_BRANDING: EmailBranding = {
  brandName: 'Orchemet',
  logoUrl: null,
  emailLogoUrl: null,
  ink: '#0F1416',
  cream: '#F3EEE3',
  gold: '#C6A045',
};

/** Fetches the live brand colors/logo so every transactional email
 * matches the actual site instead of the original launch-day palette —
 * same defensive pattern as icon.tsx/opengraph-image.tsx: never let a
 * branding lookup block the email it's dressing up. Call once per
 * request and pass the result into every render*Email() call below. */
export async function getEmailBranding(): Promise<EmailBranding> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('brand_name, logo_url, email_logo_url, color_ink, color_cream, color_gold')
      .eq('id', 'default')
      .maybeSingle();
    if (!data) return DEFAULT_BRANDING;
    return {
      brandName: data.brand_name || DEFAULT_BRANDING.brandName,
      logoUrl: data.logo_url || null,
      emailLogoUrl: data.email_logo_url || null,
      ink: data.color_ink || DEFAULT_BRANDING.ink,
      cream: data.color_cream || DEFAULT_BRANDING.cream,
      gold: data.color_gold || DEFAULT_BRANDING.gold,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

// Email clients strip <link>/@font-face far too unreliably to trust a
// custom web font (heading_font/body_font) — this system-font stack is
// the actual safe default every major client falls back to anyway.
const FONT_STACK = '-apple-system,Helvetica,Arial,sans-serif';

function wrapStyle() {
  return `font-family:${FONT_STACK};max-width:520px;margin:0 auto;color:#14181B;`;
}
function bodyStyle(b: EmailBranding) {
  return `padding:28px 32px;background:${b.cream};`;
}
function buttonStyle(b: EmailBranding) {
  return `display:inline-block;background:${b.gold};color:${b.ink};padding:13px 24px;border-radius:2px;font-weight:600;text-decoration:none;margin-top:16px;`;
}

// A dedicated, larger email lockup (business-card/flyer logo, tagline and
// all) if one's set — it's already a full brand mark, so no redundant
// "Orchemet" text alongside it. Otherwise falls back to the small site
// icon + brand name, same as before. Either way the whole header links
// back to the site, like every other page's logo already does.
function emailHeader(b: EmailBranding) {
  const inner = b.emailLogoUrl
    ? `<img src="${b.emailLogoUrl}" height="48" style="display:block;object-fit:contain;max-width:100%;" alt="${b.brandName}" />`
    : `${
        b.logoUrl
          ? `<img src="${b.logoUrl}" width="28" height="28" style="display:block;object-fit:contain;border-radius:4px;" alt="" />`
          : ''
      }<strong style="font-size:18px;">${b.brandName}</strong>`;
  return `
    <div style="background:${b.ink};color:${b.cream};padding:22px 32px;">
      <a href="${SITE_URL}" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:${b.cream};">
        ${inner}
      </a>
    </div>`;
}

function mapsUrlFor(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function locationLine(location: string) {
  if (!location) return '';
  const url = mapsUrlFor(location);
  return `<a href="${url}" style="font-size:14px;color:#5C6F72;text-decoration:underline;">${location}</a>`;
}

function calendarButtonsBlock(session: CalendarInviteInput, b: EmailBranding, sectionHeading: string) {
  const invite = buildCalendarInvite(session);
  if (!invite) return '';
  const ghostBtn =
    `display:inline-block;border:1px solid #C9BEA2;color:#3A3F33;padding:10px 18px;` +
    `border-radius:2px;font-weight:600;text-decoration:none;font-size:13.5px;margin-top:10px;margin-right:8px;`;
  // The .ics attachment on this email is the smoothest path for anyone on
  // an iPhone/Apple Calendar — including Gmail's own iOS app, where
  // Google Calendar's web link opens Google's own (often desktop-styled)
  // web app in a browser rather than adding anything locally. Leading
  // with that instead of burying it under the web links as an
  // afterthought, since it's the best experience for the largest chunk
  // of people opening this on a phone.
  return `
    <div style="margin-top:20px;">
      <div style="font-size:13px;font-weight:600;color:#3A3F33;margin-bottom:8px;">${sectionHeading}</div>
      <div
        style="background:#fff;border:1px solid #C9BEA2;border-radius:6px;padding:14px 16px;margin-bottom:12px;"
      >
        <div style="font-size:13.5px;font-weight:600;color:#3A3F33;margin-bottom:2px;">
          📅 On iPhone or use Apple Calendar?
        </div>
        <div style="font-size:13px;color:#5C6F72;line-height:1.5;">
          Tap the calendar invite attached to this email (<strong>invite.ics</strong>) — it adds the event
          directly, including a reminder 1 hour before, right on your device.
        </div>
      </div>
      <div style="font-size:12.5px;color:#8a9598;margin-bottom:2px;">Or from the web:</div>
      <a href="${invite.googleUrl}" style="${ghostBtn}">Google Calendar</a>
      <a href="${invite.outlookUrl}" style="${ghostBtn}">Outlook</a>
    </div>`;
}

type RsvpSession = { topic: string; date_text: string; location: string } & CalendarInviteInput;

export function renderRsvpConfirmationEmail(session: RsvpSession, b: EmailBranding) {
  return `
  <div style="${wrapStyle()}">
    ${emailHeader(b)}
    <div style="${bodyStyle(b)}">
      <h1 style="font-size:22px;margin:0 0 16px;">You're confirmed.</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Your seat is reserved for:</p>
      <div style="background:#fff;border:1px solid #E1DACB;border-radius:6px;padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">${session.topic}</div>
        ${session.date_text ? `<div style="font-size:14px;color:#5C6F72;margin-bottom:4px;">${session.date_text}</div>` : ''}
        ${locationLine(session.location)}
      </div>
      ${session.location ? `<a href="${mapsUrlFor(session.location)}" style="${buttonStyle(b)}">Get Directions</a>` : ''}
      ${calendarButtonsBlock(session, b, 'Add to Calendar:')}
      <p style="font-size:14px;line-height:1.6;color:#5C6F72;margin-top:20px;">We'll send a reminder the day before. See you there.</p>
    </div>
  </div>`;
}

export function renderRsvpReminderEmail(session: RsvpSession, b: EmailBranding) {
  return `
  <div style="${wrapStyle()}">
    ${emailHeader(b)}
    <div style="${bodyStyle(b)}">
      <h1 style="font-size:22px;margin:0 0 16px;">Tomorrow.</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Quick reminder — this is happening tomorrow:</p>
      <div style="background:#fff;border:1px solid #E1DACB;border-radius:6px;padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">${session.topic}</div>
        ${session.date_text ? `<div style="font-size:14px;color:#5C6F72;margin-bottom:4px;">${session.date_text}</div>` : ''}
        ${locationLine(session.location)}
      </div>
      ${session.location ? `<a href="${mapsUrlFor(session.location)}" style="${buttonStyle(b)}">Get Directions</a>` : ''}
      ${calendarButtonsBlock(session, b, "Haven't added it to your calendar yet? Add it now:")}
    </div>
  </div>`;
}

export function formatMoney(amountTotal: number | null, currency: string | null) {
  if (amountTotal == null || !currency) return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
      amountTotal / 100
    );
  } catch {
    return null;
  }
}

/** Sent once, the first time an entitlement is granted for a purchase —
 * see grant-entitlement.ts for the dedup guard that keeps a webhook retry
 * or a success-page refresh from sending this twice. */
export function renderPurchaseConfirmationEmail(
  order: { productLabel: string; amountTotal: number | null; currency: string | null },
  b: EmailBranding
) {
  const price = formatMoney(order.amountTotal, order.currency);
  return `
  <div style="${wrapStyle()}">
    ${emailHeader(b)}
    <div style="${bodyStyle(b)}">
      <h1 style="font-size:22px;margin:0 0 16px;">Order confirmed.</h1>
      <div style="background:#fff;border:1px solid #E1DACB;border-radius:6px;padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:600;margin-bottom:4px;">${order.productLabel}</div>
        ${price ? `<div style="font-size:14px;color:#5C6F72;">${price}</div>` : ''}
      </div>
      <p style="font-size:14px;line-height:1.6;color:#5C6F72;">This is now on your account's order history. Sign in any time to view it.</p>
    </div>
  </div>`;
}

export const CONTACT_REASON_LABELS: Record<string, string> = {
  general: 'General question',
  account_access: "Can't access my account",
  order_purchase: 'Order / purchase issue',
  masterclass_schedule: 'Masterclass schedule question',
  other: 'Other',
};

/** Notifies the admin inbox (site_settings.contact_email) the moment a
 * visitor submits the contact form — reply_to is set to the visitor's own
 * address so replying from a normal inbox goes straight back to them. */
export function renderContactNotificationEmail(
  msg: { name: string; email: string; reason: string; message: string },
  b: EmailBranding
) {
  return `
  <div style="${wrapStyle()}">
    ${emailHeader(b)}
    <div style="${bodyStyle(b)}">
      <p style="font-size:14px;color:#5C6F72;margin:0 0 4px;">${CONTACT_REASON_LABELS[msg.reason] ?? msg.reason}</p>
      <p style="font-size:16px;font-weight:600;margin:0 0 16px;">${msg.name} — ${msg.email}</p>
      <div style="background:#fff;border:1px solid #E1DACB;border-radius:6px;padding:18px 20px;white-space:pre-line;font-size:14.5px;line-height:1.6;">${msg.message}</div>
      <p style="font-size:12.5px;color:#8a9598;margin:16px 0 0;">Hit reply — it goes straight to ${msg.email}, not back to this notification.</p>
    </div>
  </div>`;
}

/** Auto-acknowledgment so a visitor isn't left wondering whether the form
 * actually went anywhere — no promise of a specific response time, since
 * that's not something the code can guarantee. */
export function renderContactAckEmail(msg: { name: string }, b: EmailBranding) {
  return `
  <div style="${wrapStyle()}">
    ${emailHeader(b)}
    <div style="${bodyStyle(b)}">
      <h1 style="font-size:22px;margin:0 0 16px;">Got it, ${msg.name.split(' ')[0] || 'thanks'}.</h1>
      <p style="font-size:15px;line-height:1.6;margin:0;">Your message came through — someone will get back to you personally.</p>
    </div>
  </div>`;
}
