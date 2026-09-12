/** Deliberately simple, dependency-free bar chart — labels and values are
 * always drawn on the chart (not hover-only tooltips), so a screenshot of
 * this is self-explanatory on its own, which is exactly what it needs to
 * be for a quick "here's this month" send to the accountant.
 *
 * `minWidth: 0` on every flex item below is load-bearing, not decoration:
 * without it, a flex item's automatic minimum size is its content's
 * min-content width, and a nowrap value/label can refuse to shrink below
 * that — which is exactly what forced the whole page into a horizontal
 * scroll on mobile before. With it, bars/labels shrink and ellipsize
 * instead of ever pushing the row wider than its container. */
export function BarChart({
  data,
  formatValue = (v) => String(v),
  color = 'var(--gold)',
  height = 160,
}: {
  data: { label: string; title?: string; value: number }[];
  formatValue?: (v: number) => string;
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return <p className="hint">No data for this range.</p>;

  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: 2, width: '100%' }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              style={{
                flex: `1 1 ${barWidth}%`,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
              title={d.title ? `${d.title}: ${formatValue(d.value)}` : `${d.label}: ${formatValue(d.value)}`}
            >
              {d.value > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--muted-l)',
                    marginBottom: 3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {formatValue(d.value)}
                </div>
              )}
              <div
                style={{
                  width: '70%',
                  minHeight: d.value > 0 ? 3 : 0,
                  height: `${pct}%`,
                  background: color,
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 6, width: '100%' }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: `1 1 ${barWidth}%`,
              minWidth: 0,
              textAlign: 'center',
              fontSize: 10,
              color: 'var(--muted-l)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
