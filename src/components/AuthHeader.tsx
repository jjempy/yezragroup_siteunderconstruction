import Link from 'next/link';

/**
 * A minimal top bar for every auth-shell page (login, signup, account,
 * password reset). Without this, those pages were a dead end — no nav, no
 * logo, nothing to click, so an "isolated card on a dark background" read
 * as a trapped modal with no way out except the browser back button.
 */
export function AuthHeader() {
  return (
    <div className="app-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <div className="wrap">
        <Link href="/" className="crumb" style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>
          Orchemet
        </Link>
        <Link href="/" className="crumb">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
