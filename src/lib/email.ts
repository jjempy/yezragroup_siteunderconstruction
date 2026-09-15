import 'server-only';

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
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
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
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
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

const EMAIL_WRAP_STYLE =
  'font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#14181B;';
const HEADER_STYLE = 'background:#0F1416;color:#F3EEE3;padding:28px 32px;';
const BODY_STYLE = 'padding:28px 32px;background:#F3EEE3;';
const BUTTON_STYLE =
  'display:inline-block;background:#C6A045;color:#0F1416;padding:13px 24px;border-radius:2px;font-weight:600;text-decoration:none;margin-top:16px;';

export function renderRsvpConfirmationEmail(session: {
  topic: string;
  date_text: string;
  location: string;
}) {
  return `
  <div style="${EMAIL_WRAP_STYLE}">
    <div style="${HEADER_STYLE}"><strong style="font-size:18px;">Orchemet</strong></div>
    <div style="${BODY_STYLE}">
      <h1 style="font-size:22px;margin:0 0 16px;">You're confirmed.</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Your seat is reserved for:</p>
      <div style="background:#fff;border:1px solid #E1DACB;border-radius:6px;padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">${session.topic}</div>
        ${session.date_text ? `<div style="font-size:14px;color:#5C6F72;margin-bottom:4px;">${session.date_text}</div>` : ''}
        ${session.location ? `<div style="font-size:14px;color:#5C6F72;">${session.location}</div>` : ''}
      </div>
      <p style="font-size:14px;line-height:1.6;color:#5C6F72;">We'll send a reminder the day before. See you there.</p>
    </div>
  </div>`;
}

export function renderRsvpReminderEmail(session: {
  topic: string;
  date_text: string;
  location: string;
}) {
  const mapsUrl = session.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location)}`
    : null;
  return `
  <div style="${EMAIL_WRAP_STYLE}">
    <div style="${HEADER_STYLE}"><strong style="font-size:18px;">Orchemet</strong></div>
    <div style="${BODY_STYLE}">
      <h1 style="font-size:22px;margin:0 0 16px;">Tomorrow.</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Quick reminder — this is happening tomorrow:</p>
      <div style="background:#fff;border:1px solid #E1DACB;border-radius:6px;padding:18px 20px;margin-bottom:20px;">
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">${session.topic}</div>
        ${session.date_text ? `<div style="font-size:14px;color:#5C6F72;margin-bottom:4px;">${session.date_text}</div>` : ''}
        ${session.location ? `<div style="font-size:14px;color:#5C6F72;">${session.location}</div>` : ''}
      </div>
      ${mapsUrl ? `<a href="${mapsUrl}" style="${BUTTON_STYLE}">Get Directions</a>` : ''}
    </div>
  </div>`;
}
