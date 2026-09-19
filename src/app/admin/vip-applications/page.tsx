import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { VipApplication } from '@/types/database';
import { VIP_REFERRAL_LABELS, VIP_ANNUAL_REVENUE_LABELS } from '@/lib/vip';
import { formatPhoneDisplay } from '@/lib/phone';
import { updateVipApplicationStatus } from './actions';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function VipApplicationsAdminPage() {
  await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from('vip_applications').select('*').order('created_at', { ascending: false });
  const applications = (data as VipApplication[]) ?? [];
  const newCount = applications.filter((a) => a.status === 'new').length;

  return (
    <>
      <h1>VIP Applications</h1>
      <p className="sub">
        {applications.length} total{newCount > 0 ? ` · ${newCount} new` : ''} — submitted through
        &quot;Request an Application&quot; / &quot;Apply for VIP&quot; on the homepage.
      </p>

      {applications.length === 0 ? (
        <p className="sub">No applications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {applications.map((a) => (
            <div key={a.id} className="admin-card" style={{ opacity: a.status === 'resolved' ? 0.6 : 1 }}>
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
                  <strong>{a.name}</strong> — <a href={`mailto:${a.email}`}>{a.email}</a>
                  {a.phone && (
                    <span style={{ color: 'var(--muted-l)' }}>
                      {' '}
                      · <a href={`tel:${a.phone}`}>{formatPhoneDisplay(a.phone)}</a>
                    </span>
                  )}
                  <div style={{ fontSize: 12.5, color: 'var(--muted-l)', marginTop: 2 }}>
                    {a.company ? `${a.company} · ` : ''}
                    {VIP_ANNUAL_REVENUE_LABELS[a.annual_revenue] ?? a.annual_revenue} annual revenue ·{' '}
                    {VIP_REFERRAL_LABELS[a.referral_source] ?? a.referral_source}
                    {a.referral_source === 'referred' && a.referred_by ? ` (${a.referred_by})` : ''} ·{' '}
                    {formatWhen(a.created_at)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    fontWeight: 700,
                    color: a.status === 'new' ? 'var(--gold-deep)' : 'var(--muted-l)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.status}
                </span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 14 }}>{a.message}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {a.status !== 'reviewed' && (
                  <form action={updateVipApplicationStatus}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="reviewed" />
                    <button className="admin-btn secondary" style={{ padding: '6px 14px', fontSize: 12.5 }} type="submit">
                      Mark Reviewed
                    </button>
                  </form>
                )}
                {a.status !== 'resolved' ? (
                  <form action={updateVipApplicationStatus}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <button className="admin-btn" style={{ padding: '6px 14px', fontSize: 12.5 }} type="submit">
                      Resolve
                    </button>
                  </form>
                ) : (
                  <form action={updateVipApplicationStatus}>
                    <input type="hidden" name="id" value={a.id} />
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
