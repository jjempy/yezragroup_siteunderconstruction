import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ContactMessage } from '@/types/database';
import { CONTACT_REASON_LABELS } from '@/lib/email';
import { updateMessageStatus } from './actions';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function AdminMessagesPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  const messages = (data as ContactMessage[]) ?? [];
  const newCount = messages.filter((m) => m.status === 'new').length;

  return (
    <>
      <h1>Messages</h1>
      <p className="sub">
        {messages.length} total{newCount > 0 ? ` · ${newCount} new` : ''} — submitted through the site&apos;s
        contact form.
      </p>

      {messages.length === 0 ? (
        <p className="sub">No messages yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m) => (
            <div key={m.id} className="admin-card" style={{ opacity: m.status === 'resolved' ? 0.6 : 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div>
                  <strong>{m.name}</strong> — <a href={`mailto:${m.email}`}>{m.email}</a>
                  <div style={{ fontSize: 12.5, color: 'var(--muted-l)', marginTop: 2 }}>
                    {CONTACT_REASON_LABELS[m.reason] ?? m.reason} · {formatWhen(m.created_at)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    fontWeight: 700,
                    color: m.status === 'new' ? 'var(--gold-deep)' : 'var(--muted-l)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.status}
                </span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 14 }}>{m.message}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {m.status !== 'read' && (
                  <form action={updateMessageStatus}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value="read" />
                    <button className="admin-btn secondary" style={{ padding: '6px 14px', fontSize: 12.5 }} type="submit">
                      Mark Read
                    </button>
                  </form>
                )}
                {m.status !== 'resolved' ? (
                  <form action={updateMessageStatus}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <button className="admin-btn" style={{ padding: '6px 14px', fontSize: 12.5 }} type="submit">
                      Resolve
                    </button>
                  </form>
                ) : (
                  <form action={updateMessageStatus}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value="new" />
                    <button className="admin-btn secondary" style={{ padding: '6px 14px', fontSize: 12.5 }} type="submit">
                      Reopen
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
