import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SendTestEmailButton } from '@/components/admin/SendTestEmailButton';

const BUTTONS: { type: string; label: string; hint: string }[] = [
  { type: 'rsvp_confirmation', label: 'RSVP Confirmation', hint: 'Sent instantly when someone reserves a free masterclass seat.' },
  { type: 'rsvp_reminder', label: 'RSVP Reminder (Tomorrow)', hint: 'Sent by the daily cron job the day before a session.' },
  { type: 'purchase_confirmation', label: 'Purchase Confirmation', hint: 'Sent once, the first time a purchase grants access.' },
  { type: 'contact_notification', label: 'Contact Form — Notification to You', hint: 'What lands in your inbox when someone submits /contact.' },
  { type: 'contact_ack', label: 'Contact Form — Auto-Reply to Visitor', hint: 'What the visitor gets back immediately after submitting.' },
];

export default async function EmailPreviewsPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('contact_email')
    .eq('id', 'default')
    .maybeSingle();

  // Moved here from the public /contact page — it was admin-gated there
  // too (never sent to a real visitor), but debug scaffolding has no
  // business living in a public page's code path when there's already a
  // dedicated admin tool for exactly this kind of email-sending check.
  const diagnostics: string[] = [];
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 6) ?? null;
  diagnostics.push(keyPrefix ? `RESEND_API_KEY is set (starts "${keyPrefix}").` : 'RESEND_API_KEY is NOT set.');
  diagnostics.push(
    process.env.RESEND_FROM_EMAIL
      ? `RESEND_FROM_EMAIL = ${process.env.RESEND_FROM_EMAIL}`
      : 'RESEND_FROM_EMAIL is NOT set.'
  );
  diagnostics.push(
    settings?.contact_email
      ? `Admin notifications (contact form, purchase/entitlement alerts) go to: ${settings.contact_email}`
      : 'site_settings.contact_email is EMPTY — admin notifications have nowhere to send.'
  );

  return (
    <>
      <h1>Email Previews</h1>
      <p className="sub">
        Sends a real email — using sample data, subject line prefixed &quot;TEST&quot; — to{' '}
        <strong>{settings?.contact_email || '(no admin email on file yet — set it in Hero & About)'}</strong>{' '}
        (Admin → Hero & About → Contact Email — change it there to change where these go). Use this to check a
        branding/design change in an actual inbox without waiting for a real RSVP, purchase, or contact form
        submission.
      </p>
      <div
        className="admin-card"
        style={{
          marginBottom: 20,
          fontSize: 12.5,
          fontFamily: 'monospace',
          color: 'var(--muted-l)',
          whiteSpace: 'pre-wrap',
        }}
      >
        <div style={{ marginBottom: 6, fontFamily: 'inherit', fontWeight: 600, color: 'var(--charcoal)' }}>
          Email sending diagnostics
        </div>
        {diagnostics.join('\n')}
      </div>
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {BUTTONS.map((b, i) => (
          <div
            key={b.type}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              paddingBottom: 14,
              borderBottom: i < BUTTONS.length - 1 ? '1px solid var(--line-l)' : undefined,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{b.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-l)' }}>{b.hint}</div>
            </div>
            <SendTestEmailButton type={b.type} />
          </div>
        ))}
      </div>
    </>
  );
}
