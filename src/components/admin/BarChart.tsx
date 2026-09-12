/** Deliberately simple, dependency-free bar chart — labels and values are
 * always drawn on the chart (not hover-only tooltips), so a screenshot of
 * this is self-explanatory on its own, which is exactly what it needs to
 * be for a quick "here's this month" send to the accountant. */
export function BarChart({
  data,
  formatValue = (v) => String(v),
  color = 'var(--gold)',
  height = 160,
}: {
  data: { label: string; value: number }[];
  formatValue?: (v: number) => string;
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return <p className="hint">No data for this range.</p>;

  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height, gap: 2 }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              key={i}
              style={{
                flex: `0 0 ${barWidth}%`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
              title={`${d.label}: ${formatValue(d.value)}`}
            >
              {d.value > 0 && (
                <div style={{ fontSize: 10, color: 'var(--muted-l)', marginBottom: 3, whiteSpace: 'nowrap' }}>
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
      <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: `0 0 ${barWidth}%`,
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
