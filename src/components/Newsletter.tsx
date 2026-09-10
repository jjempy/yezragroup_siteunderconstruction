// Beehiiv (or any) embed placeholder — unchanged behavior from the original:
// paste a real embed snippet here once one exists. Not currently CMS-editable
// since CONFIG never exposed it as a field either (it was a raw HTML comment
// instructing manual replacement).
export function Newsletter() {
  return (
    <section className="dark" id="newsletter">
      <div className="wrap">
        <div className="newsletter-box reveal">
          <div>
            <div className="eyebrow">Stay In The Loop</div>
            <h2 style={{ fontSize: 'clamp(24px,3vw,32px)', margin: '12px 0 8px' }}>
              Get the next masterclass before it&apos;s public.
            </h2>
            <p style={{ color: 'var(--muted-d)', fontSize: 14.5, maxWidth: 440 }}>
              One email when a new session, workshop, or library episode goes live. No spam,
              unsubscribe anytime.
            </p>
          </div>
          <div className="newsletter-embed">
            <form
              className="newsletter-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <input type="email" placeholder="you@business.com" required />
              <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                Notify Me
              </button>
            </form>
            <div className="newsletter-note">Embed not yet connected — paste your Beehiiv form code here.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
