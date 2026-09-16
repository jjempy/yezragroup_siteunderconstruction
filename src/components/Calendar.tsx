import type { CalendarSession, SiteSettings } from '@/types/database';
import { CalendarCard } from './CalendarCard';

export function Calendar({
  sessions,
  settings,
  rsvpCounts,
}: {
  sessions: CalendarSession[];
  settings: SiteSettings;
  rsvpCounts: Record<string, number>;
}) {
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
            <CalendarCard session={s} rsvpCount={rsvpCounts[s.id] ?? 0} key={s.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
