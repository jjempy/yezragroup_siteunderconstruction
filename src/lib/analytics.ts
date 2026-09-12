import 'server-only';

export type RangeKind = 'day' | 'week' | 'month' | 'ytd' | 'all';

export interface DateRange {
  start: Date; // inclusive
  end: Date; // exclusive
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Computes the [start, end) window for a range kind, `offset` periods
 * away from the current one (0 = current, -1 = previous, +1 = next —
 * next is allowed by the math but the UI never lets you page past
 * offset 0, since there's no data in the future). */
export function computeRange(kind: RangeKind, offset: number, minYear: number): DateRange {
  const now = new Date();

  if (kind === 'all') {
    return { start: new Date(2000, 0, 1), end: new Date(now.getTime() + DAY_MS), label: 'All Time' };
  }

  if (kind === 'day') {
    const start = startOfDay(now);
    start.setDate(start.getDate() + offset);
    const end = new Date(start.getTime() + DAY_MS);
    const label = start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    return { start, end, label: offset === 0 ? `Today — ${label}` : label };
  }

  if (kind === 'week') {
    const start = startOfDay(now);
    const day = start.getDay(); // 0 = Sunday
    const sinceMonday = (day + 6) % 7;
    start.setDate(start.getDate() - sinceMonday + offset * 7);
    const end = new Date(start.getTime() + 7 * DAY_MS);
    const endDisplay = new Date(end.getTime() - DAY_MS);
    const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    return { start, end, label: offset === 0 ? `This Week (${label})` : label };
  }

  if (kind === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { start, end, label: offset === 0 ? `This Month (${label})` : label };
  }

  // ytd
  const year = now.getFullYear() + offset;
  const start = new Date(year, 0, 1);
  const end = offset === 0 ? new Date(now.getTime() + DAY_MS) : new Date(year + 1, 0, 1);
  const label = offset === 0 ? `${year} Year to Date` : `${year} (Full Year)`;
  return { start, end, label: year < minYear ? `${label} — before any data` : label };
}

export interface Bucket {
  label: string;
  /** Full date/range for a title/tooltip — the bar label itself stays
   * short (a weekday, "Week 2", a month) so the chart never has to cram
   * dozens of full dates onto one axis. */
  title?: string;
  start: Date;
  end: Date;
}

const SHORT_DATE = { month: 'short', day: 'numeric' } as const;

/** Splits a range into the buckets its chart should show:
 *  - day: a single bucket (no chart, just the summary numbers)
 *  - week: 7 daily bars, labeled Mon/Tue/... only — the exact dates are
 *    already in the range header above, so repeating them on every bar
 *    is just noise.
 *  - month: weekly bars (Week 1, Week 2, ...) rather than 28-31 individual
 *    daily bars — a full month of unlabeled-but-crowded daily bars was
 *    both unreadable and the direct cause of the chart overflowing on
 *    mobile.
 *  - ytd: monthly bars (max 12)
 *  - all: yearly bars
 * Every kind tops out at a small, fixed-ish number of bars, which is what
 * actually keeps this from ever needing to scroll. */
export function bucketsFor(kind: RangeKind, range: DateRange, minYear: number): Bucket[] {
  const buckets: Bucket[] = [];

  if (kind === 'day') {
    return [{ label: 'Today', start: range.start, end: range.end }];
  }

  if (kind === 'week') {
    const cursor = new Date(range.start);
    while (cursor < range.end) {
      const bStart = new Date(cursor);
      const bEnd = new Date(cursor.getTime() + DAY_MS);
      buckets.push({
        label: bStart.toLocaleDateString('en-US', { weekday: 'short' }),
        title: bStart.toLocaleDateString('en-US', SHORT_DATE),
        start: bStart,
        end: bEnd,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  if (kind === 'month') {
    const cursor = new Date(range.start);
    let week = 1;
    while (cursor < range.end) {
      const bStart = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
      const bEnd = new Date(Math.min(cursor.getTime(), range.end.getTime()));
      const lastDay = new Date(bEnd.getTime() - DAY_MS);
      buckets.push({
        label: `Wk ${week}`,
        title: `${bStart.toLocaleDateString('en-US', SHORT_DATE)} – ${lastDay.toLocaleDateString('en-US', SHORT_DATE)}`,
        start: bStart,
        end: bEnd,
      });
      week += 1;
    }
    return buckets;
  }

  if (kind === 'ytd') {
    const year = range.start.getFullYear();
    for (let m = 0; m < 12; m++) {
      const bStart = new Date(year, m, 1);
      if (bStart >= range.end) break;
      const bEnd = new Date(year, m + 1, 1);
      buckets.push({ label: bStart.toLocaleDateString('en-US', { month: 'short' }), start: bStart, end: bEnd });
    }
    return buckets;
  }

  // all-time: one bucket per year from the earliest known data to now
  const nowYear = new Date().getFullYear();
  for (let y = minYear; y <= nowYear; y++) {
    buckets.push({ label: String(y), start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) });
  }
  return buckets;
}

/** Sums whatever numeric value a list of timestamped rows contribute into
 * each bucket. `value` defaults to counting each row as 1. */
export function bucketSums<T>(rows: T[], getDate: (row: T) => string, buckets: Bucket[], value: (row: T) => number = () => 1) {
  const sums = new Array(buckets.length).fill(0);
  for (const row of rows) {
    const t = new Date(getDate(row)).getTime();
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start.getTime() && t < buckets[i].end.getTime()) {
        sums[i] += value(row);
        break;
      }
    }
  }
  return sums;
}
