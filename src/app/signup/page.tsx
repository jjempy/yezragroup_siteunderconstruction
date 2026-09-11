'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizePhone } from '@/lib/phone';
import { AuthHeader } from '@/components/AuthHeader';

function SignupForm() {
  const params = useSearchParams();
  const redirect = params.get('redirect');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Normalize to E.164 (+18438043080) so every phone number in the
    // database is in the one format SMS/marketing tools actually expect —
    // regardless of whether autofill/the visitor typed "(843) 804-3080",
    // "18438043080", or a real international number with its own "+".
    const { value: normalizedPhone, valid: phoneValid } = normalizePhone(phone);
    if (!phoneValid) {
      setError('That phone number doesn\'t look right — check the digits and country code.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const emailRedirectTo = `${window.location.origin}/auth/callback${
        redirect ? `?redirect=${redirect}` : ''
      }`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: { full_name: fullName, phone: normalizedPhone, marketing_opt_in: marketingOptIn },
        },
      });

      if (error) {
        if (/already registered|already exists|user already/i.test(error.message)) {
          setNotice(
            "That email is already registered. Try signing in instead — or if you don't remember your password, use the reset link."
          );
        } else {
          setError(error.message);
        }
        return;
      }

      // Supabase returns a user with an empty `identities` array (no error)
      // when the email is already registered and confirmed, to avoid leaking
      // which emails exist. Treat that the same as the explicit-error case.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setNotice(
          "That email is already registered. Try signing in instead — or if you don't remember your password, use the reset link."
        );
        return;
      }

      if (data.session) {
        // .replace, not .href — same reasoning as login: the filled-out
        // signup form shouldn't be a back-button stop once the account
        // exists and is signed in.
        window.location.replace(redirect === 'checkout' ? '/api/checkout/workshop-library' : '/account');
        return;
      }

      setAwaitingConfirmation(true);
    } catch (err) {
      // A thrown error (bad Supabase URL/key, network failure, etc.) would
      // otherwise leave the button stuck on "Creating account…" forever
      // with no feedback — always surface something instead.
      setError(
        err instanceof Error
          ? `Couldn't reach the server: ${err.message}`
          : "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <>
        <AuthHeader />
        <div className="auth-shell">
        <div className="auth-card">
          <h1>Check Your Email</h1>
          <p className="sub">
            We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your
            account — you can close this tab.
          </p>
          <div className="auth-links">
            <Link href={`/login${redirect ? `?redirect=${redirect}` : ''}`}>Back to sign in</Link>
          </div>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeader />
      <div className="auth-shell">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="sub">Sign up to access purchases and manage your account.</p>
        {error && <div className="auth-error">{error}</div>}
        {notice && (
          <div className="auth-notice">
            {notice}{' '}
            {/already registered/i.test(notice) && <Link href="/forgot-password">Reset password →</Link>}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
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
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="marketing"
              type="checkbox"
              style={{ width: 'auto' }}
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
            />
            <label htmlFor="marketing" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
              Send me occasional emails about new masterclasses and workshops
            </label>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <div className="auth-links">
          <Link href={`/login${redirect ? `?redirect=${redirect}` : ''}`}>Already have an account? Sign in</Link>
        </div>
      </div>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
