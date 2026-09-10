import Link from 'next/link';
import { Mark } from './Mark';
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
        <div className="nav-links">
          <Link href="/#ladder">Ways to Work Together</Link>
          <Link href="/#calendar">Masterclasses</Link>
          <Link href="/#library">Workshop Library</Link>
          <Link href="/#about">About</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
          {isSignedIn ? (
            <Link href="/account">Account</Link>
          ) : (
            <Link href="/login">Sign In</Link>
          )}
          <Link href="/#vip" className="nav-cta">
            Apply for VIP
          </Link>
        </div>
      </nav>
    </header>
  );
}
