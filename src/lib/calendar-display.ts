// Client-safe formatting shared between the calendar admin's live preview
// and the auto-filled "Date/Time (shown on the site)" text — no
// 'server-only' marker, since both usages run in the browser.

export function to12Hour(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** What the public site's calendar card should say for a session, derived
 * from the same structured fields that drive the "Add to Calendar" invite
 * — so the two can no longer drift out of sync the way date_text and
 * start_time/end_time did when they were both independently free-typed. */
export function formatSessionDateText(sessionDate: string, startTime: string, endTime: string): string {
  if (!sessionDate) return '';
  const [y, mo, d] = sessionDate.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  if (!startTime) return dateLabel;
  const timeLabel = endTime ? `${to12Hour(startTime)} – ${to12Hour(endTime)}` : to12Hour(startTime);
  return `${dateLabel}, ${timeLabel}`;
}
