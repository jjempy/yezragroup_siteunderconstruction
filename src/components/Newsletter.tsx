'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Lean, temporary capture straight into Supabase (newsletter_signups) —
// meant to be replaced by a real ESP embed (Beehiiv) later. Keeping this
// intentionally simple: no double opt-in, no unsubscribe flow, nothing
// that would need to be un-migrated. Admin -> exports a CSV to move this
// list into a real ESP whenever one exists.
export function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const supabase = createClient();
      const { error } = await supabase.from('newsletter_signups').insert({ email, source: 'homepage' });
      // A duplicate email (already signed up) isn't a real error from the
      // visitor's point of view — treat it the same as success.
      if (error && !/duplicate|unique/i.test(error.message)) {
        throw error;
      }
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
