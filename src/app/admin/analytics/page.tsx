import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import {
  computeRange,
  bucketsFor,
  bucketSums,
  bucketSumsByProduct,
  hasTrendChart,
  percentChange,
  type RangeKind,
  type DateRange,
} from '@/lib/analytics';
import { PRODUCT_LABELS, productChartColor } from '@/lib/entitlements';
import { BarChart } from '@/components/admin/BarChart';
import { StackedBarChart } from '@/components/admin/StackedBarChart';

const RANGE_TABS: { kind: RangeKind; label: string }[] = [
  { kind: 'day', label: 'Day' },
  { kind: 'week', label: 'Week' },
  { kind: 'month', label: 'Month' },
  { kind: 'ytd', label: 'YTD' },
  { kind: 'all', label: 'All Time' },
];

// Short "vs ___" label per range kind, for the KPI delta line.
const COMPARISON_LABEL: Record<Exclude<RangeKind, 'all'>, string> = {
  day: 'yesterday',
  week: 'last week',
  month: 'last month',
  ytd: "last year's YTD",
};

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function hrefFor(kind: RangeKind, offset: number) {
  return `/admin/analytics?range=${kind}&offset=${offset}`;
}

/** The window to compare the current period against. 'all' has no
 * meaningful prior period. YTD compares against the same Jan-1-to-date
 * window one year back (not the full previous year — that would compare
 * a partial year to a complete one). Day/week/month reuse computeRange's
 * own "one period back" math, which already lands on the right calendar
 * boundaries. */
function comparisonRangeFor(kind: RangeKind, offset: number, range: DateRange, minYear: number): DateRange | null {
  if (kind === 'all') return null;
  if (kind === 'ytd') {
    const start = new Date(range.start);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(range.end);
    end.setFullYear(end.getFullYear() - 1);
    return { start, end, label: '' };
  }
  return computeRange(kind, offset - 1, minYear);
}

async function fetchTotals(admin: ReturnType<typeof createAdminClient>, startIso: string, endIso: string) {
  const [{ count: signups }, { count: newsletter }, { data: entitlements }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startIso).lt('created_at', endIso),
    admin
      .from('newsletter_signups')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lt('created_at', endIso),
    admin.from('entitlements').select('amount_total').gte('granted_at', startIso).lt('granted_at', endIso),
  ]);
  const rows = entitlements ?? [];
  return {
    signups: signups ?? 0,
    newsletter: newsletter ?? 0,
    purchases: rows.length,
    revenueCents: rows.reduce((sum, r) => sum + (r.amount_total ?? 0), 0),
  };
}

function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
  const pct = percentChange(current, previous);
  if (pct === null) return null;
  const dir = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat';
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
  return (
    <div className={`kpi-delta ${dir}`}>
      {arrow} {Math.abs(Math.round(pct))}% vs {label}
    </div>
  );
}

export default async function AnalyticsAdminPage({
  searchParams,
}: {
  searchParams: { range?: string; offset?: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const kind: RangeKind = (['day', 'week', 'month', 'ytd', 'all'] as string[]).includes(searchParams.range ?? '')
    ? (searchParams.range as RangeKind)
    : 'week';
  const offset = Number(searchParams.offset ?? '0') || 0;

  const { data: earliestProfile } = await admin
    .from('profiles')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const minYear = earliestProfile?.created_at
    ? new Date(earliestProfile.created_at).getFullYear()
    : new Date().getFullYear();

  const range = computeRange(kind, offset, minYear);
  const buckets = bucketsFor(kind, range, minYear);
  const startIso = range.start.toISOString();
  const endIso = range.end.toISOString();

  const comparisonRange = comparisonRangeFor(kind, offset, range, minYear);

  const [{ data: profiles }, { data: newsletter }, { data: entitlements }, comparison] = await Promise.all([
    admin.from('profiles').select('created_at').gte('created_at', startIso).lt('created_at', endIso),
    admin.from('newsletter_signups').select('created_at').gte('created_at', startIso).lt('created_at', endIso),
    admin.from('entitlements').select('*').gte('granted_at', startIso).lt('granted_at', endIso),
    comparisonRange
      ? fetchTotals(admin, comparisonRange.start.toISOString(), comparisonRange.end.toISOString())
      : Promise.resolve(null),
  ]);

  const signups = profiles ?? [];
  const newsletterSignups = newsletter ?? [];
  const purchases =
    (entitlements as {
      product: string;
      amount_total: number | null;
      currency: string | null;
      source: string;
      status?: string;
      granted_at: string;
    }[]) ?? [];

  const totalRevenueCents = purchases.reduce((sum, p) => sum + (p.amount_total ?? 0), 0);
  const stripeRevenueCents = purchases
    .filter((p) => p.source === 'stripe_webhook')
    .reduce((sum, p) => sum + (p.amount_total ?? 0), 0);
  const manualRevenueCents = purchases
    .filter((p) => p.source === 'manual_admin')
    .reduce((sum, p) => sum + (p.amount_total ?? 0), 0);

  const byProduct = new Map<string, { count: number; cents: number }>();
  for (const p of purchases) {
    const entry = byProduct.get(p.product) ?? { count: 0, cents: 0 };
    entry.count += 1;
    entry.cents += p.amount_total ?? 0;
    byProduct.set(p.product, entry);
  }

  const signupSeries = bucketSums(signups, (r) => r.created_at, buckets);

  // Fixed product -> color/label list (see PRODUCT_CHART_COLORS) plus an
  // "Other" catch-all only shown when a purchase exists for a product
  // this list doesn't know about yet — so a future tier never breaks the
  // chart before someone gets around to adding it above.
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

  const conversionPct = signups.length > 0 ? Math.round((purchases.length / signups.length) * 100) : null;
  const comparisonLabel = kind !== 'all' ? COMPARISON_LABEL[kind] : '';

  return (
    <>
      <h1>Analytics</h1>
      <p className="sub">
        New accounts, newsletter signups, and purchases (Stripe + manual) — for a quick read on the
        business, and to reconcile against Stripe/the accountant. Not a replacement for Stripe&apos;s own
        reporting or Google Analytics (site traffic lives there, via the GA4 ID set in Admin -&gt; Content).
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {RANGE_TABS.map((tab) => (
          <Link
            key={tab.kind}
            href={hrefFor(tab.kind, 0)}
            className="admin-btn"
            style={{
              padding: '8px 16px',
              background: tab.kind === kind ? 'var(--gold)' : 'var(--card)',
              color: tab.kind === kind ? 'var(--ink)' : 'var(--charcoal)',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {kind !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          <Link href={hrefFor(kind, offset - 1)} className="admin-btn secondary" style={{ padding: '6px 14px' }}>
            ← Previous
          </Link>
          {offset !== 0 ? (
            <Link href={hrefFor(kind, 0)} className="admin-btn secondary" style={{ padding: '6px 14px' }}>
              Today
            </Link>
          ) : (
            <span className="admin-btn secondary" style={{ padding: '6px 14px', opacity: 0.4, cursor: 'default' }}>
              Today
            </span>
          )}
          {offset < 0 ? (
            <Link href={hrefFor(kind, offset + 1)} className="admin-btn secondary" style={{ padding: '6px 14px' }}>
              Next →
            </Link>
          ) : (
            <span className="admin-btn secondary" style={{ padding: '6px 14px', opacity: 0.4, cursor: 'default' }}>
              Next →
            </span>
          )}
          <strong style={{ fontSize: 15 }}>{range.label}</strong>
        </div>
      )}
      {kind === 'all' && <p style={{ marginBottom: 24, fontWeight: 600 }}>{range.label}</p>}

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="admin-card kpi-tile">
          <div className="kpi-value">{signups.length}</div>
          <div className="hint">New accounts</div>
          {comparison && <Delta current={signups.length} previous={comparison.signups} label={comparisonLabel} />}
        </div>
        <div className="admin-card kpi-tile">
          <div className="kpi-value">{newsletterSignups.length}</div>
          <div className="hint">Newsletter signups</div>
          {comparison && (
            <Delta current={newsletterSignups.length} previous={comparison.newsletter} label={comparisonLabel} />
          )}
        </div>
        <div className="admin-card kpi-tile">
          <div className="kpi-value">{purchases.length}</div>
          <div className="hint">Purchases</div>
          {comparison && <Delta current={purchases.length} previous={comparison.purchases} label={comparisonLabel} />}
        </div>
        <div className="admin-card kpi-tile">
          <div className="kpi-value" style={{ color: 'var(--gold-deep)' }}>
            {money(totalRevenueCents)}
          </div>
          <div className="hint">Total revenue</div>
          {comparison && (
            <Delta current={totalRevenueCents} previous={comparison.revenueCents} label={comparisonLabel} />
          )}
        </div>
      </div>

      {conversionPct !== null && (
        <p className="hint" style={{ marginBottom: 20 }}>
          {purchases.length} purchase{purchases.length === 1 ? '' : 's'} ÷ {signups.length} new account
          {signups.length === 1 ? '' : 's'} this period ≈ {conversionPct}%. Not a true funnel — some of these
          purchases came from accounts created earlier, not necessarily these same signups.
        </p>
      )}

      {hasTrendChart(kind) ? (
        <>
          <div className="admin-card">
            <h2>New Accounts {kind === 'week' ? '(by day)' : kind === 'ytd' ? '(by month)' : '(by year)'}</h2>
            <BarChart data={buckets.map((b, i) => ({ label: b.label, title: b.title, value: signupSeries[i] }))} />
          </div>

          <div className="admin-card">
            <h2>Revenue by Product {kind === 'week' ? '(by day)' : kind === 'ytd' ? '(by month)' : '(by year)'}</h2>
            <StackedBarChart
              buckets={buckets}
              series={revenueSeries}
              data={revenueByProduct}
              formatValue={(v) => `$${v.toFixed(0)}`}
            />
          </div>
        </>
      ) : (
        <p className="hint" style={{ marginBottom: 20 }}>
          A single {kind} is one data point — no trend to chart from that alone. Switch to Week, YTD, or
          All Time above to see how it compares over time.
        </p>
      )}

      <div className="admin-card">
        <h2>Revenue by Source (reconciliation)</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Count</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stripe</td>
              <td>{purchases.filter((p) => p.source === 'stripe_webhook').length}</td>
              <td>{money(stripeRevenueCents)}</td>
            </tr>
            <tr>
              <td>Manual (phone sales, comps, fixes)</td>
              <td>{purchases.filter((p) => p.source === 'manual_admin').length}</td>
              <td>{money(manualRevenueCents)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h2>By Product</h2>
        {byProduct.size === 0 ? (
          <p className="hint">No purchases this period.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Count</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...byProduct.entries()].map(([product, v]) => (
                <tr key={product}>
                  <td>{PRODUCT_LABELS[product] ?? product}</td>
                  <td>{v.count}</td>
                  <td>{money(v.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
