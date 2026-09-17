'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from '@/components/AuthHeader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show the same success state, whether or not the email exists —
      // don't leak which addresses are registered.
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Couldn't reach the server: ${err.message}`
          : "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeader />
      <div className="auth-shell">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="sub">Enter your email and we&apos;ll send you a link to reset your password.</p>
        {error && <div className="auth-error">{error}</div>}
        {sent ? (
          <>
            <div className="auth-notice">
              If an account exists for that email, a reset link is on its way. It may take a minute to
              arrive.
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted-d)' }}>
              Didn&apos;t get it?{' '}
              <Link href={`/contact?context=account_access${email ? `&email=${encodeURIComponent(email)}` : ''}`}>
                Contact us
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className="auth-links">
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
      </div>
    </>
  );
}
