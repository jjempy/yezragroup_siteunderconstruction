import type { Testimonial } from '@/types/database';

// Real testimonials come from Admin -> Testimonials. This used to fall
// back to cards literally labeled "Placeholder" with "Result goes here"
// as the quote — fine in a private preview, but a real visitor scrolling
// past that directly contradicts the section's own claim ("real results,
// in their words") the moment there's nothing real to show yet. Hiding
// the whole section until there's at least one real testimonial matches
// the "hide if empty" pattern already used elsewhere on the site (e.g.
// Library) instead of showing fake proof.
export function Proof({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="dark">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">What Happens in the Room</div>
          <h2>Real results, in their words.</h2>
          <p>This wall fills in as engagements close — real names, real numbers, on camera.</p>
        </div>
        <div className="proof-grid">
          {testimonials.map((t) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}
