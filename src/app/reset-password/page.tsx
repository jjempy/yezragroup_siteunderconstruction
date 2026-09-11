'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from '@/components/AuthHeader';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The recovery link redirects here with tokens in the URL; the browser
    // client parses them and fires PASSWORD_RECOVERY once ready.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setInvalid(true), 4000);
    return () => clearTimeout(t);
  }, [ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 1800);
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
        <h1>Set New Password</h1>
        <p className="sub">Choose a new password for your account.</p>
        {invalid && !ready && (
          <div className="auth-error">
            This reset link is invalid or has expired. Request a new one from the sign-in page.
          </div>
        )}
        {error && <div className="auth-error">{error}</div>}
        {done ? (
          <div className="auth-notice">Password updated. Redirecting you to sign in…</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading || (!ready && invalid)}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
      </div>
    </>
  );
}
