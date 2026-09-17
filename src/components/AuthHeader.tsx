import Link from 'next/link';
import { BackButton } from './BackButton';
import { Mark } from './Mark';

/**
 * A minimal top bar for every auth-shell page (login, signup, account,
 * password reset). Without this, those pages were a dead end — no nav, no
 * logo, nothing to click, so an "isolated card on a dark background" read
 * as a trapped modal with no way out except the browser back button.
 *
 * The brand mark sits centered (not left-aligned like the homepage nav)
 * since this bar has nothing else competing for space, and doubles as a
 * home link. ← Back replicates the actual browser-back gesture (see
 * BackButton) rather than always dropping you at the homepage.
 */
export function AuthHeader() {
  return (
    <div className="app-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <div className="wrap auth-header-wrap">
        <BackButton className="crumb back-to-site-link" />
        <Link href="/" className="crumb site-brand-center" aria-label="Back to homepage">
          <Mark size={26} />
        </Link>
      </div>
    </div>
  );
}
