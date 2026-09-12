import { EmphasisText } from './EmphasisText';
import type { SiteSettings } from '@/types/database';

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="hero">
      {settings.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="hero-mark orbit-spark"
          src={settings.logo_url}
          alt=""
          style={{ opacity: 0.5, width: 360, height: 360, objectFit: 'contain' }}
        />
      ) : (
        <svg
          className="hero-mark orbit-spark"
          width="360"
          height="360"
          viewBox="0 0 40 40"
          style={{ opacity: 0.5 }}
        >
          <circle className="spark" cx="27" cy="14" r="6.6" />
          <circle className="primary" cx="18" cy="21" r="11.5" />
        </svg>
      )}
      <div className="wrap hero-inner">
        <div className="eyebrow">{settings.hero_eyebrow}</div>
        <h1>
          <EmphasisText text={settings.hero_heading} />
        </h1>
        <p className="lede">{settings.hero_lede}</p>
        <div className="cta-row">
          <a href="#calendar" className="btn-primary">
            Reserve a Free Seat
          </a>
          <a href="#ladder" className="btn-ghost">
            See How We Work Together
          </a>
        </div>
      </div>
    </section>
  );
}
