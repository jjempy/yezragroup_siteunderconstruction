import type { CalendarSession, SiteSettings } from '@/types/database';
import { CalendarCard } from './CalendarCard';

export function Calendar({ sessions, settings }: { sessions: CalendarSession[]; settings: SiteSettings }) {
  return (
    <section className="dark" id="calendar">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">{settings.calendar_eyebrow}</div>
          <h2>{settings.calendar_heading}</h2>
          <p>{settings.calendar_lede}</p>
        </div>
        <div className="cal-grid">
          {sessions.map((s) => (
            <CalendarCard session={s} key={s.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
