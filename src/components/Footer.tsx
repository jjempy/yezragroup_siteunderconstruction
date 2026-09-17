import Link from 'next/link';
import { Mark } from './Mark';
import type { SiteSettings } from '@/types/database';

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              {settings.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="brand-logo-img" src={settings.logo_url} alt="" />
              ) : (
                <Mark size={26} />
              )}
              {!settings.logo_url && <span className="brand-name">{settings.brand_name}</span>}
            </div>
            <p style={{ maxWidth: 280, fontSize: 13, lineHeight: 1.6 }}>
              Practical AI and business systems, built on what actually happened — not what should
              work.
            </p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h4>Work Together</h4>
              <a href="#ladder">Ways to Work Together</a>
              <a href="#calendar">Free Masterclasses</a>
              <a href="#vip">VIP Intensive</a>
            </div>
            <div className="foot-col">
              <h4>Learn</h4>
              <a href="#library">Workshop Library</a>
              <a href="#about">About</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="foot-col">
              <h4>Connect</h4>
              <Link href="/contact">Contact Us</Link>
              {settings.contact_phone && <a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a>}
              {settings.youtube_channel_url && (
                <a href={settings.youtube_channel_url} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube
                </a>
              )}
              {settings.spotify_url && (
                <a href={settings.spotify_url} target="_blank" rel="noopener noreferrer">
                  Listen on Spotify
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {settings.brand_name}. All rights reserved.</span>
          <span>
            <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
