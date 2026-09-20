import { createClient } from '@/lib/supabase/server';
import type { CalendarSession, MasterclassRsvp } from '@/types/database';
import { addSession, deleteSession, updateSession } from './actions';
import { AdminHighlightOnLoad } from '@/components/admin/AdminHighlightOnLoad';
import { CalendarTimeFields } from '@/components/admin/CalendarTimeFields';

type Bucket = 'today' | 'upcoming' | 'unscheduled' | 'past';

function bucketOf(session: CalendarSession, todayStr: string): Bucket {
  if (!session.session_date) return 'unscheduled';
  if (session.session_date === todayStr) return 'today';
  return session.session_date > todayStr ? 'upcoming' : 'past';
}

function formatSessionDate(dateStr: string) {
  // Parse as a plain calendar date (no time/timezone shifting).
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function CalendarAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const supabase = createClient();
  const [{ data: sessions }, { data: rsvpRows }] = await Promise.all([
    supabase.from('calendar_sessions').select('*').order('sort_order'),
    supabase.from('masterclass_rsvps').select('*').order('created_at', { ascending: false }),
  ]);
  const list = (sessions as CalendarSession[]) ?? [];
  const rsvpsBySession = new Map<string, MasterclassRsvp[]>();
  for (const r of (rsvpRows as MasterclassRsvp[]) ?? []) {
    const arr = rsvpsBySession.get(r.calendar_session_id) ?? [];
    arr.push(r);
    rsvpsBySession.set(r.calendar_session_id, arr);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const groups: Record<Bucket, CalendarSession[]> = {
    today: [],
    upcoming: [],
    unscheduled: [],
    past: [],
  };
  for (const s of list) groups[bucketOf(s, todayStr)].push(s);

  groups.upcoming.sort((a, b) => (a.session_date! < b.session_date! ? -1 : 1));
  groups.past.sort((a, b) => (a.session_date! > b.session_date! ? -1 : 1)); // most recent past first

  const sections: { key: Bucket; title: string; hint?: string }[] = [
    { key: 'today', title: `Today · ${formatSessionDate(todayStr)}` },
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'unscheduled', title: 'Unscheduled', hint: 'Add a date below to move these into the timeline.' },
    { key: 'past', title: 'Past' },
  ];

  return (
    <>
      <AdminHighlightOnLoad />
      <h1>Calendar</h1>
      <p className="sub">
        Only real, confirmed sessions belong here — no “TBD” filler cards. Give a session a date and it&apos;ll
        sort itself into Today / Upcoming / Past automatically.{' '}
        <a href="/api/admin/calendar/rsvps/export" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          Export all RSVPs (CSV)
        </a>
      </p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}
      {searchParams.error && <p className="admin-toast err">{searchParams.error}</p>}

      <div className="agenda-jump">
        {sections.map((sec) => (
          <a key={sec.key} href={`#agenda-${sec.key}`} className="agenda-jump-pill">
            {sec.key === 'today' ? 'Today' : sec.title} <span>({groups[sec.key].length})</span>
          </a>
        ))}
      </div>

      <details className="admin-card" style={{ marginBottom: 28 }}>
        <summary className="agenda-add-summary">+ Add a Session</summary>
        <form action={addSession} style={{ marginTop: 18 }}>
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="label">Month/Label</label>
              <input id="label" name="label" type="text" required placeholder="September 2026" />
            </div>
            <div className="admin-field">
              <label htmlFor="session_date">Date (for sorting/tracking)</label>
              <input id="session_date" name="session_date" type="date" />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="topic">Topic</label>
            <input id="topic" name="topic" type="text" required />
          </div>
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" type="text" />
            </div>
            <div className="admin-field">
              <label htmlFor="date_text">Date/Time (shown on the site)</label>
              <input id="date_text" name="date_text" type="text" placeholder="Sept 21, 10:00 AM – 12:00 PM" />
            </div>
          </div>
          <CalendarTimeFields />
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="status">Status</label>
              <input id="status" name="status" type="text" defaultValue="Open" placeholder="Open, Full, VIP Only…" />
              <div className="hint">
                With an RSVP Cap set below, the site ignores this and shows &quot;Seats Available&quot; or
                &quot;Full&quot; automatically — except typing &quot;Full&quot; here always marks it full, cap or not.
                Without a cap, this text shows exactly as typed (e.g. &quot;VIP Only&quot;).
              </div>
            </div>
            <div className="admin-field">
              <label htmlFor="capacity">RSVP Cap (optional)</label>
              <input id="capacity" name="capacity" type="number" min="1" placeholder="Unlimited" />
              <div className="hint">Once RSVPs reach this number, the site shows it as full automatically — and stops accepting new RSVPs.</div>
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Add Session
          </button>
        </form>
      </details>

      {sections.map((sec) => {
        const items = groups[sec.key];
        return (
          <div className="agenda-group" id={`agenda-${sec.key}`} key={sec.key}>
            <h2 className={`agenda-group-title agenda-${sec.key}`}>{sec.title}</h2>
            {sec.hint && items.length > 0 && <p className="hint" style={{ marginBottom: 12 }}>{sec.hint}</p>}
            {items.length === 0 ? (
              <p className="hint">Nothing here.</p>
            ) : (
              items.map((session) => {
                const rsvps = rsvpsBySession.get(session.id) ?? [];
                return (
                <details className={`agenda-item agenda-${sec.key}`} key={session.id}>
                  <summary>
                    <span className="agenda-item-date">
                      {session.session_date ? formatSessionDate(session.session_date) : session.label}
                    </span>
                    <span className="agenda-item-topic">{session.topic}</span>
                    {rsvps.length > 0 && (
                      <span
                        className="agenda-item-status"
                        style={{
                          background:
                            session.capacity != null && rsvps.length >= session.capacity
                              ? 'rgba(180,87,63,.14)'
                              : 'rgba(92,143,99,.14)',
                          color: session.capacity != null && rsvps.length >= session.capacity ? '#B4573F' : '#3f7a4a',
                        }}
                      >
                        {rsvps.length}
                        {session.capacity != null ? `/${session.capacity}` : ''} RSVP{rsvps.length === 1 ? '' : 's'}
                      </span>
                    )}
                    <span className="agenda-item-status">{session.status}</span>
                    {!session.is_visible && <span className="agenda-item-hidden">Hidden</span>}
                  </summary>
                  <div className="agenda-item-body">
                    {rsvps.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: 13, marginBottom: 8, color: 'var(--muted-l)' }}>
                          RSVPs ({rsvps.length})
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {rsvps.map((r) => (
                            <div key={r.id} style={{ fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              <strong>{r.full_name || '—'}</strong>
                              <span style={{ color: 'var(--muted-l)' }}>{r.email}</span>
                              {r.phone && <span style={{ color: 'var(--muted-l)' }}>{r.phone}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <form action={updateSession.bind(null, session.id)}>
                      <div className="admin-row">
                        <div className="admin-field">
                          <label htmlFor={`label-${session.id}`}>Month/Label</label>
                          <input id={`label-${session.id}`} name="label" type="text" defaultValue={session.label} required />
                        </div>
                        <div className="admin-field">
                          <label htmlFor={`session_date-${session.id}`}>Date (for sorting/tracking)</label>
                          <input
                            id={`session_date-${session.id}`}
                            name="session_date"
                            type="date"
                            defaultValue={session.session_date ?? ''}
                          />
                        </div>
                      </div>
                      <div className="admin-field">
                        <label htmlFor={`topic-${session.id}`}>Topic</label>
                        <input id={`topic-${session.id}`} name="topic" type="text" defaultValue={session.topic} required />
                      </div>
                      <div className="admin-row">
                        <div className="admin-field">
                          <label htmlFor={`location-${session.id}`}>Location</label>
                          <input id={`location-${session.id}`} name="location" type="text" defaultValue={session.location} />
                        </div>
                        <div className="admin-field">
                          <label htmlFor={`date_text-${session.id}`}>Date/Time (shown on the site)</label>
                          <input id={`date_text-${session.id}`} name="date_text" type="text" defaultValue={session.date_text} />
                        </div>
                      </div>
                      <CalendarTimeFields
                        idSuffix={`-${session.id}`}
                        defaultStart={session.start_time ?? ''}
                        defaultEnd={session.end_time ?? ''}
                      />
                      <div className="admin-row">
                        <div className="admin-field">
                          <label htmlFor={`status-${session.id}`}>Status</label>
                          <input id={`status-${session.id}`} name="status" type="text" defaultValue={session.status} />
                          <div className="hint">Only shown as-typed with no RSVP Cap set — a cap shows &quot;Seats Available&quot;/&quot;Full&quot; automatically instead.</div>
                        </div>
                        <div className="admin-field">
                          <label htmlFor={`capacity-${session.id}`}>RSVP Cap (optional)</label>
                          <input
                            id={`capacity-${session.id}`}
                            name="capacity"
                            type="number"
                            min="1"
                            defaultValue={session.capacity ?? ''}
                            placeholder="Unlimited"
                          />
                        </div>
                      </div>
                      <label className="admin-checkbox">
                        <input type="checkbox" name="is_visible" defaultChecked={session.is_visible} />
                        Visible
                      </label>
                      <div style={{ marginTop: 16 }}>
                        <button className="admin-btn" type="submit">
                          Save
                        </button>
                      </div>
                    </form>
                    <form action={deleteSession.bind(null, session.id)} style={{ marginTop: 10 }}>
                      <button className="admin-btn danger" type="submit">
                        Remove
                      </button>
                    </form>
                  </div>
                </details>
                );
              })
            )}
          </div>
        );
      })}
    </>
  );
}
