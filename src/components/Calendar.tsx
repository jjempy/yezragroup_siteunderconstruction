import type { CalendarSession } from '@/types/database';
import { CalendarCard } from './CalendarCard';

export function Calendar({ sessions }: { sessions: CalendarSession[] }) {
  return (
    <section className="dark" id="calendar">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">The Year Ahead</div>
          <h2>12 months. 12 masterclasses.</h2>
          <p>
            One live session most months, always free, always built around a blind spot business
            owners don&apos;t know they have until it costs them.
          </p>
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
