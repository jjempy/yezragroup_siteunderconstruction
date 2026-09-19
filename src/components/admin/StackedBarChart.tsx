/** Revenue-by-product stacked bar chart. A server component (no client
 * JS) — the hover tooltip and hover "lift" are pure CSS (:hover/:focus on
 * a wrapper toggling a child's visibility), keeping this as dependency-
 * and bundle-free as the plain BarChart it sits next to.
 *
 * Design follows the dataviz skill's stacked-bar spec: a fixed
 * categorical color per product (never reassigned by what's visible in
 * a given period — see PRODUCT_CHART_COLORS), a 2px surface gap between
 * touching segments, a 4px rounded top only on the actual top of each
 * bar's colored stack (not the empty space above a short bar), a legend
 * (mandatory at 2+ series), a total value at the tip of each bar, a
 * per-segment tooltip reachable by hover AND keyboard focus, and a table
 * view underneath so every number is reachable without hovering at all.
 */
import { niceAxisMax } from '@/lib/analytics';

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
}

export function StackedBarChart({
  buckets,
  series,
  data,
  formatValue = (v) => String(v),
  height = 200,
}: {
  buckets: { label: string; title?: string }[];
  series: StackedSeries[];
  data: Record<string, number>[];
  formatValue?: (v: number) => string;
  height?: number;
}) {
  if (buckets.length === 0) return <p className="hint">No data for this range.</p>;

  const totals = data.map((row) => series.reduce((sum, s) => sum + (row[s.key] ?? 0), 0));
  const axisMax = niceAxisMax(Math.max(1, ...totals));
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="stacked-chart">
      <div className="chart-legend">
        {series.map((s) => (
          <div className="chart-legend-item" key={s.key}>
            <span className="chart-legend-swatch" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </div>
        ))}
      </div>

      <div className="stacked-chart-body">
        <div className="stacked-chart-axis" style={{ height }}>
          {ticks
            .slice()
            .reverse()
            .map((t) => (
              <div className="stacked-axis-tick" key={t}>
                {formatValue(Math.round(axisMax * t))}
              </div>
            ))}
        </div>

        <div className="stacked-chart-plot">
          <div className="stacked-chart-gridlines" style={{ height }} aria-hidden="true">
            {ticks.map((t) => (
              <div className="stacked-gridline" style={{ bottom: `${t * 100}%` }} key={t} />
            ))}
          </div>

          <div className="stacked-chart-bars">
            {buckets.map((bucket, i) => {
              const row = data[i] ?? {};
              let cumulative = 0;
              const nonZeroIdx = [...series.keys()].filter((k) => (row[series[k].key] ?? 0) > 0).pop();
              const totalHeightPx = (totals[i] / axisMax) * height;

              return (
                <div className="stacked-bar-col" key={i} title={bucket.title}>
                  <div className="stacked-bar-stack" style={{ height }}>
                    {/* Positioned to track the actual top of this bar, not
                        a fixed row above the whole chart — "value at the
                        tip" means at THIS bar's tip, which moves with its
                        height. */}
                    {totals[i] > 0 && (
                      <div className="stacked-bar-total" style={{ bottom: totalHeightPx }}>
                        {formatValue(totals[i])}
                      </div>
                    )}
                    {series.map((s, si) => {
                      const value = row[s.key] ?? 0;
                      if (value <= 0) return null;
                      const rawHeight = (value / axisMax) * height;
                      const gap = cumulative === 0 ? 0 : 2;
                      const renderHeight = Math.max(0, rawHeight - gap);
                      const bottom = cumulative + gap;
                      cumulative += rawHeight;
                      return (
                        <div
                          key={s.key}
                          className="stacked-seg-wrap"
                          style={{ bottom, height: renderHeight }}
                          tabIndex={0}
                          role="img"
                          aria-label={`${s.label}, ${bucket.title ?? bucket.label}: ${formatValue(value)}`}
                        >
                          <div
                            className="stacked-segment"
                            style={{
                              background: s.color,
                              borderRadius: si === nonZeroIdx ? '4px 4px 0 0' : undefined,
                            }}
                          />
                          <div className="stacked-tooltip">
                            <strong>{formatValue(value)}</strong>
                            <span>{s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="stacked-bar-label">{bucket.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <details className="stacked-chart-table">
        <summary>View as table</summary>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Period</th>
              {series.map((s) => (
                <th key={s.key}>{s.label}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket, i) => (
              <tr key={i}>
                <td>{bucket.title ?? bucket.label}</td>
                {series.map((s) => (
                  <td key={s.key}>{formatValue(data[i]?.[s.key] ?? 0)}</td>
                ))}
                <td>
                  <strong>{formatValue(totals[i])}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
