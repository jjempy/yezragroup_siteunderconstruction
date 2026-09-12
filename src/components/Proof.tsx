import type { Testimonial } from '@/types/database';

// Real testimonials come from Admin -> Testimonials. Until any exist,
// this falls back to the original placeholder cards rather than showing
// an empty section — the "wall fills in as engagements close" promise
// in the copy below is about these placeholders specifically.
const PLACEHOLDERS = [1, 2, 3];

export function Proof({ testimonials }: { testimonials: Testimonial[] }) {
  const hasReal = testimonials.length > 0;

  return (
    <section className="dark">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">What Happens in the Room</div>
          <h2>Real results, in their words.</h2>
          <p>This wall fills in as engagements close — real names, real numbers, on camera.</p>
        </div>
        <div className="proof-grid">
          {hasReal
            ? testimonials.map((t) => (
                <div className="proof-card reveal" key={t.id}>
                  <div className="proof-quote">&quot;{t.quote}&quot;</div>
                  <div className="proof-who">
                    <strong>
                      {t.name}
                      {t.title ? `, ${t.title}` : ''}
                    </strong>
                    {t.company}
                  </div>
                </div>
              ))
            : PLACEHOLDERS.map((i) => (
                <div className="proof-card reveal" key={i}>
                  <div className="proof-flag">Placeholder</div>
                  <div className="proof-quote">
                    &quot;<span className="accent">Result goes here</span> — quote from a completed
                    engagement.&quot;
                  </div>
                  <div className="proof-who">
                    <strong>Name, Title</strong>Company / Industry
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
