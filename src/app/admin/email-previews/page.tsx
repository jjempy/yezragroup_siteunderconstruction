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
