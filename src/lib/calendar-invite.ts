import 'server-only';

/**
 * Builds "Add to Calendar" options for a masterclass session — a Google
 * Calendar link, an Outlook.com link, and an .ics file (as a base64
 * attachment, not a hosted URL — Apple Mail/Outlook desktop/most mail
 * apps recognize a .ics attachment automatically and offer their own
 * "Add to Calendar" prompt right on the attachment, no click-through
 * page needed). The .ics includes a VALARM 1 hour before start, which
 * every major calendar app turns into a real local device notification
 * once the event is actually added — that's the whole mechanism; there's
 * no separate "push a reminder to their phone" step, importing the event
 * *is* what sets the device-native reminder.
 *
 * Returns null if the session doesn't have enough structured data to
 * build a real event (needs session_date + start_time at minimum) —
 * date_text is free-typed admin copy ("Sept 21, 10am-ish") and can't be
 * safely parsed into an actual start/end time.
 */

const TIMEZONE = 'America/New_York';

function toUtcParts(dateStr: string, timeStr: string): { y: number; mo: number; d: number; h: number; mi: number } {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  return { y, mo, d, h, mi };
}

// Converts a wall-clock time in TIMEZONE to a UTC Date, accounting for
// DST — there's no Intl-based direct "zoned time -> UTC" conversion, so
// this uses the standard trick: format a UTC guess in the target zone,
// compare, and correct by the offset difference.
function zonedTimeToUtc(dateStr: string, timeStr: string): Date {
  const { y, mo, d, h, mi } = toUtcParts(dateStr, timeStr);
  const guessUtc = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
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

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

export interface CalendarInviteInput {
  id: string; // stable id (e.g. calendar_sessions.id) — used for the ICS UID
  topic: string;
  location: string;
  session_date: string | null; // YYYY-MM-DD
  start_time: string | null; // HH:MM, 24h
  end_time: string | null; // HH:MM, 24h
}

export interface CalendarInviteLinks {
  googleUrl: string;
  outlookUrl: string;
  icsBase64: string;
}

export function buildCalendarInvite(session: CalendarInviteInput): CalendarInviteLinks | null {
  if (!session.session_date || !session.start_time) return null;

  const start = zonedTimeToUtc(session.session_date, session.start_time);
  const end = session.end_time
    ? zonedTimeToUtc(session.session_date, session.end_time)
    : new Date(start.getTime() + 60 * 60 * 1000); // default 1hr if no end time set

  const description = `Reserved through Orchemet. ${session.location ? `Location: ${session.location}. ` : ''}Questions? Reply to your confirmation email.`;

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(session.topic)}` +
    `&dates=${toIcsUtc(start)}/${toIcsUtc(end)}` +
    `&details=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(session.location)}`;

  const outlookUrl =
    `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
    `&subject=${encodeURIComponent(session.topic)}` +
    `&startdt=${start.toISOString()}` +
    `&enddt=${end.toISOString()}` +
    `&body=${encodeURIComponent(description)}` +
    `&location=${encodeURIComponent(session.location)}`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Orchemet//Masterclass//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${session.id}@orchemet.com`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(session.topic)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    session.location ? `LOCATION:${escapeIcsText(session.location)}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return {
    googleUrl,
    outlookUrl,
    icsBase64: Buffer.from(ics).toString('base64'),
  };
}
