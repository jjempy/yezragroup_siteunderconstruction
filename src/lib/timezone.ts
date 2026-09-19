import 'server-only';

/** The one physical location/timezone this business actually operates
 * from. Used anywhere "today," "this week," "this month" needs one
 * canonical definition instead of silently following whatever timezone
 * the server happens to run in — Vercel's servers run in UTC, which is
 * exactly what caused Analytics range boundaries and admin timestamps
 * to read hours off from when things actually happened. A visitor's own
 * device timezone isn't the right anchor for *this* — "today" for the
 * business's own reporting has to mean one specific day, not a
 * different one depending on who's looking at the screen. */
export const BUSINESS_TIMEZONE = 'America/New_York';

/** Converts a wall-clock date/time in `timeZone` to the UTC instant it
 * actually represents, correctly accounting for DST. There's no direct
 * Intl API for "zoned wall clock -> UTC," so this uses the standard
 * trick: format a UTC guess in the target zone, compare the result
 * against the wall-clock time we wanted, and correct by the difference.
 * (Originally written for calendar-invite.ts's .ics generation, verified
 * correct across both EDT and EST — reused here rather than
 * reimplemented so this DST logic only exists once.) */
export function zonedWallClockToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string = BUSINESS_TIMEZONE
): Date {
  const guessUtc = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(guessUtc).map((p) => [p.type, p.value]));
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour),
    Number(parts.minute)
  );
  const offsetMs = guessUtc.getTime() - asIfUtc;
  return new Date(guessUtc.getTime() + offsetMs);
}

/** Midnight of the given calendar date in `timeZone`, as the UTC
 * instant it actually represents — the correct boundary for "the start
 * of this day," not just a UTC-midnight guess wearing the right date
 * number. */
export function zonedMidnightUtc(y: number, mo: number, d: number, timeZone: string = BUSINESS_TIMEZONE): Date {
  return zonedWallClockToUtc(y, mo, d, 0, 0, timeZone);
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** What calendar date `date` falls on in `timeZone` — the inverse of
 * zonedMidnightUtc: given a UTC instant, what day does it actually read
 * as at this business's location. Used to recover "which Eastern day is
 * this range boundary" from a UTC instant already computed via
 * zonedMidnightUtc, so a caller can iterate day-by-day (or month-by-
 * month) in calendar terms without redoing the UTC math each step. */
export function zonedDateParts(date: Date, timeZone: string = BUSINESS_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  };
}

/** "What day is it right now, at this business's actual location" — a
 * server has no built-in way to know that, since its own runtime clock
 * reports UTC. */
export function zonedNowParts(timeZone: string = BUSINESS_TIMEZONE) {
  return zonedDateParts(new Date(), timeZone);
}
