'use client';

import { useState } from 'react';
import { formatSessionDateText, to12Hour } from '@/lib/calendar-display';

/** Date (for sorting), the public "Date/Time shown on the site" text, and
 * Start/End Time (which drive the "Add to Calendar" invite) used to be
 * three-to-four independently free-typed fields with nothing connecting
 * them — which is exactly how a real, live session ended up showing
 * "12:00 PM" on the site while its invite said "11:00 PM". Now the
 * site-facing text auto-fills from Date + Start/End Time as they're set,
 * and only stops auto-updating once someone types directly into it
 * (matching the familiar "edit the slug yourself and it stops
 * following the title" pattern) — so there's one source of truth unless
 * a session genuinely needs custom wording (e.g. "TBD" while unscheduled). */
export function CalendarScheduleFields({
  idSuffix = '',
  defaultSessionDate = '',
  defaultDateText = '',
  defaultStart = '',
  defaultEnd = '',
}: {
  idSuffix?: string;
  defaultSessionDate?: string;
  defaultDateText?: string;
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const [sessionDate, setSessionDate] = useState(defaultSessionDate);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [dateText, setDateText] = useState(defaultDateText);
  const [dateTextTouched, setDateTextTouched] = useState(false);

  function syncDateText(nextSessionDate: string, nextStart: string, nextEnd: string) {
    if (dateTextTouched) return;
    const computed = formatSessionDateText(nextSessionDate, nextStart, nextEnd);
    if (computed) setDateText(computed);
  }

  const invitePreview = start && end ? `${to12Hour(start)} – ${to12Hour(end)} Eastern` : null;

  return (
    <>
      <div className="admin-row">
        <div className="admin-field">
          <label htmlFor={`session_date${idSuffix}`}>Date (for sorting/tracking)</label>
          <input
            id={`session_date${idSuffix}`}
            name="session_date"
            type="date"
            value={sessionDate}
            onChange={(e) => {
              setSessionDate(e.target.value);
              syncDateText(e.target.value, start, end);
            }}
          />
        </div>
        <div className="admin-field">
          <label htmlFor={`date_text${idSuffix}`}>Date/Time (shown on the site)</label>
          <input
            id={`date_text${idSuffix}`}
            name="date_text"
            type="text"
            placeholder="Sept 21, 10:00 AM – 12:00 PM"
            value={dateText}
            onChange={(e) => {
              setDateText(e.target.value);
              setDateTextTouched(true);
            }}
          />
          <div className="hint">
            {dateTextTouched
              ? "Manually edited, so it won't auto-update anymore — clear it to resume following Date + Start/End Time."
              : 'Auto-fills from Date + Start/End Time as you set them below. Type here directly to override.'}
          </div>
        </div>
      </div>
      <div className="admin-row">
        <div className="admin-field">
          <label htmlFor={`start_time${idSuffix}`}>Start Time (for calendar invites)</label>
          <input
            id={`start_time${idSuffix}`}
            name="start_time"
            type="time"
            step="900"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              syncDateText(sessionDate, e.target.value, end);
            }}
          />
          <div className="hint">
            Powers the &quot;Add to Calendar&quot; buttons in the RSVP emails. Eastern time. Leave blank to skip
            those buttons for this session.
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor={`end_time${idSuffix}`}>End Time (for calendar invites)</label>
          <input
            id={`end_time${idSuffix}`}
            name="end_time"
            type="time"
            step="900"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              syncDateText(sessionDate, start, e.target.value);
            }}
          />
          {invitePreview && (
            <div className="hint" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
              Calendar invite will say: {invitePreview}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
