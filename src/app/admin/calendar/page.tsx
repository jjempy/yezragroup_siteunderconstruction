import { createClient } from '@/lib/supabase/server';
import type { CalendarSession } from '@/types/database';
import { addSession, deleteSession, moveSession, updateSession } from './actions';

export default async function CalendarAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const { data: sessions } = await supabase.from('calendar_sessions').select('*').order('sort_order');
  const list = (sessions as CalendarSession[]) ?? [];

  return (
    <>
      <h1>Calendar</h1>
      <p className="sub">Only real, confirmed sessions belong here — no “TBD” filler cards.</p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}

      <div className="admin-card">
        <h2>Add a Session</h2>
        <form action={addSession}>
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="label">Month/Label</label>
              <input id="label" name="label" type="text" required placeholder="September 2026" />
            </div>
            <div className="admin-field">
              <label htmlFor="status">Status</label>
              <input id="status" name="status" type="text" defaultValue="Open" />
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
              <label htmlFor="date_text">Date/Time</label>
              <input id="date_text" name="date_text" type="text" placeholder="Sept 21, 10:00 AM – 12:00 PM" />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Add Session
          </button>
        </form>
      </div>

      {list.map((session, i) => (
        <div className="admin-card" key={session.id}>
          <form action={updateSession.bind(null, session.id)}>
            <div className="admin-row">
              <div className="admin-field">
                <label htmlFor={`label-${session.id}`}>Month/Label</label>
                <input id={`label-${session.id}`} name="label" type="text" defaultValue={session.label} required />
              </div>
              <div className="admin-field">
                <label htmlFor={`status-${session.id}`}>Status</label>
                <input id={`status-${session.id}`} name="status" type="text" defaultValue={session.status} />
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
                <label htmlFor={`date_text-${session.id}`}>Date/Time</label>
                <input id={`date_text-${session.id}`} name="date_text" type="text" defaultValue={session.date_text} />
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
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <form action={moveSession.bind(null, session.id, 'up')}>
              <button className="admin-btn secondary" type="submit" disabled={i === 0}>
                ↑ Move Up
              </button>
            </form>
            <form action={moveSession.bind(null, session.id, 'down')}>
              <button className="admin-btn secondary" type="submit" disabled={i === list.length - 1}>
                ↓ Move Down
              </button>
            </form>
            <form action={deleteSession.bind(null, session.id)}>
              <button className="admin-btn danger" type="submit">
                Remove
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
