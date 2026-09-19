import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { VipApplication } from '@/types/database';
import { VIP_REFERRAL_LABELS, VIP_ANNUAL_REVENUE_LABELS } from '@/lib/vip';
import { formatPhoneDisplay } from '@/lib/phone';
import { LocalTimestamp } from '@/components/LocalTimestamp';
import { VipStatusSelect } from '@/components/admin/VipStatusSelect';
import { updateVipApplicationNotes } from './actions';

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
        &quot;Request an Application&quot; / &quot;Apply for VIP&quot; on the homepage. This is a stand-in
        for a real CRM until Airtable is set up — the Status and Notes below are the running record.
      </p>

      {applications.length === 0 ? (
        <p className="sub">No applications yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {applications.map((a) => (
            <div
              key={a.id}
              className="admin-card"
              style={{ opacity: a.status === 'sale' || a.status === 'no_sale' ? 0.7 : 1 }}
            >
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
                    {a.company ? (
                      <>
                        {a.company_url ? (
                          <a href={a.company_url} target="_blank" rel="noopener noreferrer">
                            {a.company}
                          </a>
                        ) : (
                          a.company
                        )}{' '}
                        ·{' '}
                      </>
                    ) : (
                      ''
                    )}
                    {VIP_ANNUAL_REVENUE_LABELS[a.annual_revenue] ?? a.annual_revenue} annual revenue ·{' '}
                    {VIP_REFERRAL_LABELS[a.referral_source] ?? a.referral_source}
                    {a.referral_source === 'referred' && a.referred_by ? ` (${a.referred_by})` : ''} ·{' '}
                    <LocalTimestamp iso={a.created_at} variant="when" />
                  </div>
                </div>
                <VipStatusSelect id={a.id} status={a.status} />
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 14 }}>{a.message}</p>

              <form action={updateVipApplicationNotes}>
                <input type="hidden" name="id" value={a.id} />
                <div className="admin-field" style={{ marginBottom: 8 }}>
                  <label htmlFor={`notes-${a.id}`}>Notes</label>
                  <textarea
                    id={`notes-${a.id}`}
                    name="notes"
                    defaultValue={a.notes}
                    rows={4}
                    placeholder="Running notes — call summaries, next steps, anything worth remembering. No length limit."
                  />
                </div>
                <button className="admin-btn secondary" type="submit" style={{ padding: '6px 14px', fontSize: 12.5 }}>
                  Save Notes
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
