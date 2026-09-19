'use client';

import { useState } from 'react';

// Lean, temporary capture — meant to be replaced by a real ESP embed
// (Beehiiv) later. Keeping this intentionally simple: no double opt-in,
// no unsubscribe flow, nothing that would need to be un-migrated. Admin
// -> exports a CSV to move this list into a real ESP whenever one
// exists. Posts to /api/newsletter (not a direct client-side Supabase
// insert, like this used to be) so the honeypot field below is actually
// enforced server-side instead of only in JS a bot can ignore.
export function Newsletter() {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState(''); // honeypot — see the hidden field below
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company }),
      });
      if (!res.ok) throw new Error('Newsletter signup failed');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

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
            {status === 'done' ? (
              <div className="newsletter-note" style={{ color: 'var(--gold-bright)' }}>
                You&apos;re on the list — thanks!
              </div>
            ) : (
              <>
                <form className="newsletter-form" onSubmit={handleSubmit}>
                  <div style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden="true">
                    <label htmlFor="newsletter-company">Company</label>
                    <input
                      id="newsletter-company"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="you@business.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ whiteSpace: 'nowrap' }}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? 'Submitting…' : 'Notify Me'}
                  </button>
                </form>
                {status === 'error' && (
                  <div className="newsletter-note" style={{ color: '#E29684' }}>
                    Something went wrong — try again in a moment.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
