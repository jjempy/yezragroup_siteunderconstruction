import type { SiteSettings } from '@/types/database';

export function About({ settings }: { settings: SiteSettings }) {
  return (
    <section className="light" id="about">
      <div className="wrap about-grid">
        <div className="about-photo reveal" id="founder-photo">
          <div className="about-photo-fallback" />
          {settings.founder_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="about-photo-img"
              src={settings.founder_photo_url}
              alt={`${settings.brand_name} — Founder`}
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
