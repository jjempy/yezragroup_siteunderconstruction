import { resolveTierHref } from '@/lib/site-data';
import type { LadderTier, SiteSettings } from '@/types/database';

export function Ladder({
  tiers,
  settings,
  userId,
}: {
  tiers: LadderTier[];
  settings: SiteSettings;
  userId: string | null;
}) {
  if (tiers.length === 0) return null;

  return (
    <section className="light" id="ladder">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Five Ways We Work Together</div>
          <h2>From a free evening to a private day.</h2>
          <p>
            Start wherever makes sense. Most people move up the ladder as trust builds — nobody&apos;s
            asked to jump in at the top.
          </p>
        </div>
        <div className="ladder">
          {tiers.map((tier, i) => {
            const { href, configured } = resolveTierHref(tier, settings, userId);
            const isGold = tier.slug === 'vip';
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
                  <a
                    href={href}
                    className={`rung-btn${isGold ? ' gold' : ''}${!configured ? ' not-configured' : ''}`}
                    title={configured ? undefined : 'Not connected yet — set the link in Admin → Ladder.'}
                  >
                    {tier.cta_label}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
