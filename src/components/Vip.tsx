import { resolveTierHref } from '@/lib/site-data';
import type { LadderTier, SiteSettings } from '@/types/database';

export function Vip({
  tier,
  settings,
  userId,
}: {
  tier: LadderTier | undefined;
  settings: SiteSettings;
  userId: string | null;
}) {
  if (!tier) return null;
  const { href, configured } = resolveTierHref(tier, settings, userId);

  return (
    <section className="dark" id="vip">
      <div className="wrap">
        <div className="vip reveal">
          <div className="vip-grid">
            <div>
              <div className="eyebrow">By Application Only</div>
              <h2>{tier.title}</h2>
              <p>{tier.description}</p>
              <div className="vip-list">
                <div>
                  <span className="dot" />
                  2-hour private 1:1 working session
                </div>
                <div>
                  <span className="dot" />
                  1-hour recorded conversation for your own YouTube, podcast, or team
                </div>
                <div>
                  <span className="dot" />A follow-up scope document, not just notes
                </div>
                <div>
                  <span className="dot" />
                  90 days of follow-up email access, scoped to implementing your session plan — the
                  recording and materials are yours to keep
                </div>
              </div>
              <p style={{ fontSize: 13 }}>
                Limited to a small number of days per year. Application review, not open checkout.
              </p>
            </div>
            <div className="vip-side">
              <div className="label">Investment</div>
              <div className="price">{tier.price_label}</div>
              <a
                href={href}
                className="btn-primary"
                title={configured ? undefined : 'Not connected yet — set the link in Admin → Ladder.'}
              >
                Request an Application
              </a>
              <div className="fine">
                Most applicants are referred from a completed scoped engagement or masterclass series.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
