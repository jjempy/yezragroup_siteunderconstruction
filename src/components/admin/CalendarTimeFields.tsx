'use client';

import { useState } from 'react';

function to12Hour(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Start/End Time fields for a calendar session's "Add to Calendar" invite.
 * These drive buildCalendarInvite() independently of the free-typed
 * Date/Time text shown on the site — nothing links the two, so a typo
 * here (e.g. 11:00 PM instead of 12:00 PM) silently ships wrong invites
 * with no error anywhere. This renders a live "Calendar invite will say"
 * preview so that drift is visible immediately, at entry time. */
export function CalendarTimeFields({
  idSuffix = '',
  defaultStart = '',
  defaultEnd = '',
}: {
  idSuffix?: string;
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const preview = start && end ? `${to12Hour(start)} – ${to12Hour(end)} Eastern` : null;

  return (
    <div className="admin-row">
      <div className="admin-field">
        <label htmlFor={`start_time${idSuffix}`}>Start Time (for calendar invites)</label>
        <input
          id={`start_time${idSuffix}`}
          name="start_time"
          type="time"
          step="900"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <div className="hint">
          Powers the &quot;Add to Calendar&quot; buttons in the RSVP emails — separate from Date/Time above, which
          is just display text. Eastern time. Leave blank to skip those buttons for this session.
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
          onChange={(e) => setEnd(e.target.value)}
        />
        {preview && (
          <div className="hint" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
            Calendar invite will say: {preview} — make sure this matches Date/Time above.
          </div>
        )}
      </div>
    </div>
  );
}
