import Image from 'next/image';
import type { SiteSettings } from '@/types/database';

export function About({ settings }: { settings: SiteSettings }) {
  return (
    <section className="light" id="about">
      <div className="wrap about-grid">
        <div className="about-photo reveal" id="founder-photo">
          <div className="about-photo-fallback" />
          {settings.founder_photo_url && (
            // A real photograph, further down the page than the hero —
            // next/image lazy-loads it by default (good; no `priority`
            // here) and serves it resized/format-converted instead of
            // the same full-resolution upload to every device.
            <Image
              className="about-photo-img"
              src={settings.founder_photo_url}
              alt={`${settings.brand_name} — Founder`}
              fill
              sizes="(max-width: 800px) 100vw, 480px"
            />
          )}
        </div>
        <div className="about-text reveal">
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            About
          </div>
          {settings.about_body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
