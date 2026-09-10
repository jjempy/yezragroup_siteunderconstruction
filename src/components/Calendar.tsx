import type { CalendarSession } from '@/types/database';

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
            <div className="cal-card reveal" key={s.id}>
              <div className="cal-month">{s.label}</div>
              <div className="cal-topic">{s.topic}</div>
              <div className="cal-meta">{s.location}</div>
              <div className="cal-meta" style={{ marginTop: 2 }}>
                {s.date_text}
              </div>
              <div className="cal-status">{s.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
