import 'server-only';
import { zonedMidnightUtc, zonedNowParts, zonedDateParts } from '@/lib/timezone';

export type RangeKind = 'day' | 'week' | 'month' | 'ytd' | 'all';

export interface DateRange {
  start: Date; // inclusive
  end: Date; // exclusive
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Computes the [start, end) window for a range kind, `offset` periods
 * away from the current one (0 = current, -1 = previous, +1 = next —
 * next is allowed by the math but the UI never lets you page past
 * offset 0, since there's no data in the future).
 *
 * "Today"/"this week"/etc. anchor on the business's own timezone
 * (zonedNowParts/zonedMidnightUtc — see lib/timezone.ts), not the
 * server's. Vercel's servers run in UTC: computing "midnight" with a
 * plain `Date` used to mean UTC midnight, which is 4-5 hours off from
 * this business's actual day boundary — a purchase at 9pm Eastern could
 * land in "tomorrow," or "today" could still include stuff from
 * yesterday evening. All date-only arithmetic below (adding/subtracting
 * days, months) happens on plain calendar numbers first — safe
 * regardless of timezone, since there's no time-of-day involved — and
 * only gets converted to a real UTC instant (via zonedMidnightUtc) at
 * the end, for the actual query boundary. */
export function computeRange(kind: RangeKind, offset: number, minYear: number): DateRange {
  const today = zonedNowParts();

  if (kind === 'all') {
    return { start: new Date(2000, 0, 1), end: new Date(Date.now() + DAY_MS), label: 'All Time' };
  }

  if (kind === 'day') {
    const d = new Date(today.year, today.month - 1, today.day);
    d.setDate(d.getDate() + offset);
    const start = zonedMidnightUtc(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const end = new Date(start.getTime() + DAY_MS);
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    return { start, end, label: offset === 0 ? `Today — ${label}` : label };
  }

  if (kind === 'week') {
    const sinceMonday = (today.weekday + 6) % 7; // weekday: 0 = Sunday
    const weekStart = new Date(today.year, today.month - 1, today.day);
    weekStart.setDate(weekStart.getDate() - sinceMonday + offset * 7);
    const weekEndDisplay = new Date(weekStart);
    weekEndDisplay.setDate(weekStart.getDate() + 6);
    const start = zonedMidnightUtc(weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate());
    const end = new Date(start.getTime() + 7 * DAY_MS);
    const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEndDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    return { start, end, label: offset === 0 ? `This Week (${label})` : label };
  }

  if (kind === 'month') {
    const d = new Date(today.year, today.month - 1 + offset, 1);
    const start = zonedMidnightUtc(d.getFullYear(), d.getMonth() + 1, 1);
    const endMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const end = zonedMidnightUtc(endMonth.getFullYear(), endMonth.getMonth() + 1, 1);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { start, end, label: offset === 0 ? `This Month (${label})` : label };
  }

  // ytd
  const year = today.year + offset;
  const start = zonedMidnightUtc(year, 1, 1);
  const end = offset === 0 ? new Date(Date.now() + DAY_MS) : zonedMidnightUtc(year + 1, 1, 1);
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
    // Iterated by calendar date (via zonedDateParts/zonedMidnightUtc),
    // not by adding a flat 24h to the previous boundary — on the two
    // DST-transition days a year, the Eastern calendar day is 23 or 25
    // real hours long, so a flat +24h would drift off the actual next
    // midnight on exactly those days.
    const cursor = zonedDateParts(range.start);
    const cursorDate = new Date(cursor.year, cursor.month - 1, cursor.day);
    for (let i = 0; i < 7; i++) {
      const bStart = zonedMidnightUtc(cursorDate.getFullYear(), cursorDate.getMonth() + 1, cursorDate.getDate());
      const nextDate = new Date(cursorDate);
      nextDate.setDate(cursorDate.getDate() + 1);
      const bEnd = zonedMidnightUtc(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
      buckets.push({
        // A bare day-of-month number ("12") only made sense with the
        // full date behind a hover tooltip — invisible on touch devices,
        // and easy to misread as a count rather than a date even on
        // desktop. Weekday + day ("Mon 12") reads as a date on sight,
        // with no hover required.
        label: cursorDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
        title: cursorDate.toLocaleDateString('en-US', SHORT_DATE),
        start: bStart,
        end: bEnd,
      });
      cursorDate.setDate(cursorDate.getDate() + 1);
    }
    return buckets;
  }

  if (kind === 'ytd') {
    const { year } = zonedDateParts(range.start);
    for (let m = 0; m < 12; m++) {
      const bStart = zonedMidnightUtc(year, m + 1, 1);
      if (bStart >= range.end) break;
      const bEnd = m === 11 ? zonedMidnightUtc(year + 1, 1, 1) : zonedMidnightUtc(year, m + 2, 1);
      const labelDate = new Date(year, m, 1);
      buckets.push({ label: labelDate.toLocaleDateString('en-US', { month: 'short' }), start: bStart, end: bEnd });
    }
    return buckets;
  }

  // all-time: one bucket per year from the earliest known data to now
  const nowYear = zonedNowParts().year;
  for (let y = minYear; y <= nowYear; y++) {
    buckets.push({ label: String(y), start: zonedMidnightUtc(y, 1, 1), end: zonedMidnightUtc(y + 1, 1, 1) });
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

/** Same idea as bucketSums, but split by product per bucket instead of a
 * single total — what the stacked revenue-by-product chart draws from.
 * Returns one { product: value } map per bucket, in the same order. */
export function bucketSumsByProduct<T>(
  rows: T[],
  getDate: (row: T) => string,
  getProduct: (row: T) => string,
  buckets: Bucket[],
  value: (row: T) => number = () => 1
): Record<string, number>[] {
  const sums: Record<string, number>[] = buckets.map(() => ({}));
  for (const row of rows) {
    const t = new Date(getDate(row)).getTime();
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start.getTime() && t < buckets[i].end.getTime()) {
        const product = getProduct(row);
        sums[i][product] = (sums[i][product] ?? 0) + value(row);
        break;
      }
    }
  }
  return sums;
}

/** Rounds a chart's axis ceiling up to a "clean" number (1/2/5 x a power
 * of ten) instead of the raw max value — so gridlines land on numbers a
 * reader would actually round to, not something like "$1,847". */
export function niceAxisMax(rawMax: number): number {
  if (rawMax <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const normalized = rawMax / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Percent change from `previous` to `current`, or null when there's no
 * meaningful baseline to compare against (previous period had nothing at
 * all) — a "+∞%" delta is noise, not a number worth showing. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
