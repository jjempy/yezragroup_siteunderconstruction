import Image from 'next/image';
import { EmphasisText } from './EmphasisText';
import type { SiteSettings } from '@/types/database';

export function Hero({
  settings,
  masterclassAvailable,
}: {
  settings: SiteSettings;
  // Whether a real Calendar session is currently bookable. "Reserve a
  // Free Seat" only ever scrolled to #calendar — a real audit caught that
  // reading like an instant booking even when there was nothing left to
  // reserve (a past session, or none scheduled). When there's nothing
  // live, this swaps to an honest CTA that routes to the newsletter
  // instead of promising a seat that doesn't exist.
  masterclassAvailable: boolean;
}) {
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
          {masterclassAvailable ? (
            <a href="#calendar" className="btn-primary">
              Reserve a Free Seat
            </a>
          ) : (
            <a href="#newsletter" className="btn-primary">
              Get Notified for the Next Date
            </a>
          )}
          <a href="#ladder" className="btn-ghost">
            See How We Work Together
          </a>
        </div>
      </div>
    </section>
  );
}
