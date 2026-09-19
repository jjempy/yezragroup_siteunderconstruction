import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeRange, bucketsFor, bucketSumsByProduct } from '@/lib/analytics';
import { PRODUCT_LABELS, productChartColor } from '@/lib/entitlements';
import { StackedBarChart } from '@/components/admin/StackedBarChart';
import type { CalendarSession, MasterclassRsvp } from '@/types/database';

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/** The old dashboard was a card grid that exactly duplicated the sidebar
 * nav — every page it linked to was already one click away, so it added
 * no information, just an extra click. This is a real landing view
 * instead: this week's numbers (same data Analytics computes, just the
 * headline slice of it) and the handful of things that actually need a
 * human to look at them, so opening /admin answers "how's business" and
 * "what needs me" without a detour through Analytics or Messages first. */
export default async function AdminDashboard() {
  const admin = createAdminClient();
  const weekRange = computeRange('week', 0, new Date().getFullYear());
  const buckets = bucketsFor('week', weekRange, new Date().getFullYear());
  const startIso = weekRange.start.toISOString();
  const endIso = weekRange.end.toISOString();

  const [{ count: newMessages }, { data: entitlements }, { data: sessions }, { data: rsvpRows }] = await Promise.all([
    admin.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('entitlements').select('*').gte('granted_at', startIso).lt('granted_at', endIso),
    admin.from('calendar_sessions').select('*').eq('is_visible', true),
    admin.from('masterclass_rsvps').select('calendar_session_id'),
  ]);

  const purchases =
    (entitlements as { product: string; amount_total: number | null; granted_at: string }[]) ?? [];
  const totalRevenueCents = purchases.reduce((sum, p) => sum + (p.amount_total ?? 0), 0);

  const knownProducts = new Set(Object.keys(PRODUCT_LABELS));
  const hasOtherProduct = purchases.some((p) => !knownProducts.has(p.product));
  const revenueSeries = [
    ...Object.entries(PRODUCT_LABELS).map(([key, label]) => ({ key, label, color: productChartColor(key) })),
    ...(hasOtherProduct ? [{ key: 'other', label: 'Other', color: productChartColor('other') }] : []),
  ];
  const revenueByProduct = bucketSumsByProduct(
    purchases,
    (r) => r.granted_at,
    (r) => (knownProducts.has(r.product) ? r.product : 'other'),
    buckets,
    (r) => (r.amount_total ?? 0) / 100
  );

  // "Needs attention" is deliberately narrow — real, verifiable signals
  // only (an unread message, a session actually near or at capacity),
  // never a vague activity feed nobody trusts.
  const rsvpCounts = new Map<string, number>();
  for (const r of (rsvpRows as Pick<MasterclassRsvp, 'calendar_session_id'>[]) ?? []) {
    rsvpCounts.set(r.calendar_session_id, (rsvpCounts.get(r.calendar_session_id) ?? 0) + 1);
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const nearCapacity = ((sessions as CalendarSession[]) ?? [])
    .filter((s) => s.capacity != null && s.session_date && s.session_date >= todayStr)
    .map((s) => ({ session: s, count: rsvpCounts.get(s.id) ?? 0 }))
    .filter(({ session, count }) => count >= session.capacity! * 0.8);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
        <h1>Dashboard</h1>
        <Link href="/admin/analytics" style={{ fontSize: 13.5, color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          View full Analytics →
        </Link>
      </div>
      <p className="sub">{weekRange.label} at a glance.</p>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="admin-card kpi-tile">
          <div className="kpi-value">{purchases.length}</div>
          <div className="hint">Purchases this week</div>
        </div>
        <div className="admin-card kpi-tile">
          <div className="kpi-value" style={{ color: 'var(--gold-deep)' }}>
            {money(totalRevenueCents)}
          </div>
          <div className="hint">Revenue this week</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <h2>Needs Attention</h2>
        {!newMessages && nearCapacity.length === 0 ? (
          <p className="hint">Nothing needs you right now.</p>
        ) : (
          <div className="attention-list">
            {Boolean(newMessages) && (
              <Link href="/admin/messages" className="attention-row" style={{ textDecoration: 'none' }}>
                <span>
                  Unread contact message{newMessages === 1 ? '' : 's'}
                </span>
                <span className="attention-count">{newMessages}</span>
              </Link>
            )}
            {nearCapacity.map(({ session, count }) => (
              <Link href="/admin/calendar" key={session.id} className="attention-row" style={{ textDecoration: 'none' }}>
                <span>
                  {session.topic} is {count >= session.capacity! ? 'full' : 'nearly full'}
                </span>
                <span className="attention-count">
                  {count}/{session.capacity}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>Revenue by Product (this week, by day)</h2>
        <StackedBarChart buckets={buckets} series={revenueSeries} data={revenueByProduct} formatValue={(v) => `$${v.toFixed(0)}`} />
      </div>
    </>
  );
}
