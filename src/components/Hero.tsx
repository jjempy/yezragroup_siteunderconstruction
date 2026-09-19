import Image from 'next/image';
import { EmphasisText } from './EmphasisText';
import type { SiteSettings } from '@/types/database';

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="hero">
      {settings.hero_mark_url ? (
        // Above-the-fold and often the largest visible element on the
        // page (the LCP candidate the audit flagged) — next/image gives
        // it automatic format conversion (WebP/AVIF) and, with
        // `priority`, preloads it instead of the default lazy-load,
        // which would otherwise delay exactly the metric this is fixing.
        <Image
          className="hero-mark orbit-spark"
          src={settings.hero_mark_url}
          alt=""
          width={240}
          height={240}
          priority
          style={
            {
              opacity: settings.hero_mark_opacity / 100,
              '--hero-mark-opacity': settings.hero_mark_opacity / 100,
              objectFit: 'contain',
            } as React.CSSProperties
          }
        />
      ) : (
        <svg
          className="hero-mark orbit-spark"
          width="360"
          height="360"
          viewBox="0 0 40 40"
          style={
            {
              opacity: settings.hero_mark_opacity / 100,
              '--hero-mark-opacity': settings.hero_mark_opacity / 100,
            } as React.CSSProperties
          }
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
