import Link from 'next/link';
import { Mark } from './Mark';
import { MobileNavToggle } from './MobileNavToggle';
import type { SiteSettings } from '@/types/database';

export function Nav({
  settings,
  isSignedIn,
  isAdmin,
}: {
  settings: SiteSettings;
  isSignedIn: boolean;
  isAdmin: boolean;
}) {
  return (
    <header>
      <nav>
        <div className="brand">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="brand-logo-img" src={settings.logo_url} alt="" />
          ) : (
            <Mark />
          )}
          {!settings.logo_url && <span className="brand-name">{settings.brand_name}</span>}
        </div>

        {isSignedIn ? (
          // Signed-in visitors already know the pitch — repeating the same
          // four scroll-to-section links (plus a VIP pitch) at them on
          // every page is clutter, not navigation. Keep it to the two
          // things they'd actually come back for.
          <div className="nav-links nav-links-member">
            {isAdmin && (
              <Link href="/admin" className="nav-admin-link">
                Admin
              </Link>
            )}
            <Link href="/account" className="nav-cta nav-cta-ghost">
              Account
            </Link>
          </div>
        ) : (
          <>
            <MobileNavToggle>
              <Link href="/#ladder">Ways to Work Together</Link>
              <Link href="/#calendar">Masterclasses</Link>
              <Link href="/#library">Workshop Library</Link>
              <Link href="/#about">About</Link>
              <Link href="/login" className="nav-links-signin">
                Sign In
              </Link>
            </MobileNavToggle>
            <Link href="/#vip" className="nav-cta">
              Apply for VIP
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
