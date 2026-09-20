import { resolveTierHref } from '@/lib/site-data';
import type { LadderTier, SiteSettings } from '@/types/database';

export function Ladder({
  tiers,
  settings,
  userId,
  masterclassAvailable,
}: {
  tiers: LadderTier[];
  settings: SiteSettings;
  userId: string | null;
  // Whether a real Calendar session is currently bookable — overrides the
  // "Free Masterclass" rung's manual sold_out toggle so the two can't say
  // different things (see lib/calendar-display.ts's isSessionBookable).
  masterclassAvailable: boolean;
}) {
  if (tiers.length === 0) return null;

  return (
    <section className="light" id="ladder">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">{settings.ladder_eyebrow}</div>
          <h2>{settings.ladder_heading}</h2>
          <p>{settings.ladder_lede}</p>
        </div>
        <div className="ladder">
          {tiers.map((tier, i) => {
            const { href, configured } = resolveTierHref(tier, settings, userId);
            const isGold = tier.slug === 'vip';
            const soldOut = tier.slug === 'masterclass' ? !masterclassAvailable : tier.sold_out;
            return (
              <div key={tier.id} className={`rung reveal${tier.is_top ? ' top' : ''}`}>
                <div className="rung-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="rung-title">{tier.title}</div>
                  <div className="rung-desc">{tier.description}</div>
                </div>
                <div className="rung-price">
                  <span className="amt">{tier.price_label}</span>
                  <span className="fmt">{tier.price_sub_label}</span>
                  {soldOut ? (
                    <div className="rung-sold-out">
                      {tier.sold_out_message || 'Not available right now — check back soon.'}
                    </div>
                  ) : (
                    <a
                      href={href}
                      className={`rung-btn${isGold ? ' gold' : ''}${!configured ? ' not-configured' : ''}`}
                      title={configured ? undefined : 'Not connected yet — set the link in Admin → Ladder.'}
                    >
                      {tier.cta_label}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
