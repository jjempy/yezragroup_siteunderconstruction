import { createClient } from '@/lib/supabase/server';
import type { CalendarSession } from '@/types/database';
import { addSession, deleteSession, updateSession } from './actions';

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
  const { data: sessions } = await supabase.from('calendar_sessions').select('*').order('sort_order');
  const list = (sessions as CalendarSession[]) ?? [];

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
      <h1>Calendar</h1>
      <p className="sub">
        Only real, confirmed sessions belong here — no “TBD” filler cards. Give a session a date and it&apos;ll
        sort itself into Today / Upcoming / Past automatically.
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
          <div className="admin-field">
            <label htmlFor="status">Status</label>
            <input id="status" name="status" type="text" defaultValue="Open" placeholder="Open, Full, VIP Only…" />
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
              items.map((session) => (
                <details className={`agenda-item agenda-${sec.key}`} key={session.id}>
                  <summary>
                    <span className="agenda-item-date">
                      {session.session_date ? formatSessionDate(session.session_date) : session.label}
                    </span>
                    <span className="agenda-item-topic">{session.topic}</span>
                    <span className="agenda-item-status">{session.status}</span>
                    {!session.is_visible && <span className="agenda-item-hidden">Hidden</span>}
                  </summary>
                  <div className="agenda-item-body">
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
                      <div className="admin-field">
                        <label htmlFor={`status-${session.id}`}>Status</label>
                        <input id={`status-${session.id}`} name="status" type="text" defaultValue={session.status} />
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
              ))
            )}
          </div>
        );
      })}
    </>
  );
}
