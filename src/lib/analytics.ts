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
 *  - day: a single bucket — one point has no trend to show, so the page
 *    skips the chart entirely for this range and shows just the totals.
 *  - week: 7 daily bars, each labeled with its day-of-month number only
 *    ("8" not "Sep 8") — compact, but the actual date is still ON the
 *    chart itself rather than only in a header above it that a viewer
 *    glancing at just the graph (or a screenshot of it) would never see.
 *  - month: a single bucket, same reasoning as "day" — a month is one
 *    period for this business's current volume; breaking it into weeks
 *    manufactures a trend line out of what's usually a handful of
 *    events, which reads as more precise than the data actually is.
 *  - ytd: monthly bars (max 12), each a full calendar month — real
 *    month-over-month trend, worth charting.
 *  - all: yearly bars — real year-over-year trend, worth charting.
 * Anything with more than one bucket also stays capped at a small,
 * fixed-ish count, which is what keeps this from ever needing to scroll. */
export function bucketsFor(kind: RangeKind, range: DateRange, minYear: number): Bucket[] {
  const buckets: Bucket[] = [];

  if (kind === 'day' || kind === 'month') {
    return [{ label: '', start: range.start, end: range.end }];
  }

  if (kind === 'week') {
    const cursor = new Date(range.start);
    while (cursor < range.end) {
      const bStart = new Date(cursor);
      const bEnd = new Date(cursor.getTime() + DAY_MS);
      buckets.push({
        // A bare day-of-month number ("12") only made sense with the
        // full date behind a hover tooltip — invisible on touch devices,
        // and easy to misread as a count rather than a date even on
        // desktop. Weekday + day ("Mon 12") reads as a date on sight,
        // with no hover required.
        label: bStart.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        title: bStart.toLocaleDateString('en-US', SHORT_DATE),
        start: bStart,
        end: bEnd,
      });
      cursor.setDate(cursor.getDate() + 1);
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

/** Whether this range kind has more than one period to actually chart a
 * trend across — day/month are single, point-in-time totals (already
 * shown as the KPI numbers), so a "chart" of one bar would just repeat
 * that number with none of a chart's actual value: seeing change over
 * time. */
export function hasTrendChart(kind: RangeKind): boolean {
  return kind === 'week' || kind === 'ytd' || kind === 'all';
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
