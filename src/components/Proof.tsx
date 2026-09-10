// Static placeholder testimonial cards — unchanged from the original design.
// These fill in with real names/results as engagements close; no CMS field
// was defined for these in CONFIG, so they stay hardcoded as before.
export function Proof() {
  const cards = [1, 2, 3];
  return (
    <section className="dark">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">What Happens in the Room</div>
          <h2>Real results, in their words.</h2>
          <p>This wall fills in as engagements close — real names, real numbers, on camera.</p>
        </div>
        <div className="proof-grid">
          {cards.map((i) => (
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
