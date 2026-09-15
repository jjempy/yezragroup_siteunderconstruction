'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CalendarSession } from '@/types/database';

/** One masterclass session card with a real RSVP capture — the card used
 * to be purely informational (topic/date/location), no way to actually
 * signal you're coming. Lean on purpose, same posture as the newsletter
 * capture: no login required, straight into Supabase, duplicate RSVPs
 * (same email/session) treated as success rather than an error. */
export function CalendarCard({ session }: { session: CalendarSession }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const supabase = createClient();
      const { error } = await supabase.from('masterclass_rsvps').insert({
        calendar_session_id: session.id,
        full_name: name,
        email,
        phone,
      });
      if (error && !/duplicate|unique/i.test(error.message)) throw error;
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  const isFull = session.status.toLowerCase() === 'full';

  return (
    <div className="cal-card reveal in">
      <div className="cal-month">{session.label}</div>
      <div className="cal-topic">{session.topic}</div>
      {session.location && (
        <a
          className="cal-meta"
          style={{ textDecoration: 'underline', display: 'block' }}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {session.location}
        </a>
      )}
      <div className="cal-meta" style={{ marginTop: 2 }}>
        {session.date_text}
      </div>
      <div className="cal-status">{session.status}</div>

      {status === 'done' ? (
        <div className="cal-rsvp-note" style={{ color: 'var(--gold-bright)' }}>
          You&apos;re on the list — see you there.
        </div>
      ) : isFull ? (
        <div className="cal-rsvp-note">This session is full.</div>
      ) : open ? (
        <form className="cal-rsvp-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={status === 'loading'} style={{ width: '100%' }}>
            {status === 'loading' ? 'Reserving…' : 'Confirm My Seat'}
          </button>
          {status === 'error' && (
            <div className="cal-rsvp-note" style={{ color: '#E29684' }}>
              Something went wrong — try again in a moment.
            </div>
          )}
        </form>
      ) : (
        <button type="button" className="btn-primary cal-rsvp-btn" onClick={() => setOpen(true)}>
          Reserve a Free Seat
        </button>
      )}
    </div>
  );
}
