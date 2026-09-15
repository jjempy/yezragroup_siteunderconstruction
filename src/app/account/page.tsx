import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';
import { signOutAction, updateProfileAction, updateRosterOptIn } from './actions';
import type { Entitlement, LadderTier, PaidVideoRow } from '@/types/database';
import { formatPhoneDisplay } from '@/lib/phone';
import { PRODUCT_LABELS } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(amountTotal: number | null, currency: string | null) {
  if (amountTotal == null || !currency) return 'Free / comped';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
      amountTotal / 100
    );
  } catch {
    return null;
  }
}

// A row counts as active if it exists and its status isn't 'revoked' — a
// missing `status` column (0010 migration not yet run) reads as
// undefined, which stays on the permissive side rather than accidentally
// locking out a real buyer.
function isActive(e: { status?: string } | null | undefined) {
  return Boolean(e) && e?.status !== 'revoked';
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const { user, profile } = await requireUser();
  const supabase = createClient();

  const [{ data: entitlementRows }, { data: tiers }, { data: paidVideos }, { data: views }] = await Promise.all([
    supabase.from('entitlements').select('*').eq('user_id', user.id).order('granted_at', { ascending: false }),
    supabase.from('ladder_tiers').select('*'),
    supabase.from('paid_videos').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('paid_video_views').select('paid_video_id').eq('user_id', user.id),
  ]);

  const orderList = (entitlementRows as Entitlement[]) ?? [];
  const allTiers = (tiers as LadderTier[]) ?? [];
  const videoList = (paidVideos as PaidVideoRow[]) ?? [];
  const viewedCount = new Set(((views as { paid_video_id: string }[]) ?? []).map((v) => v.paid_video_id)).size;

  const byProduct = new Map(orderList.filter((e) => isActive(e)).map((e) => [e.product, e]));
  const workshopEntitlement = byProduct.get('workshop_library');
  const workshopTier = allTiers.find((t) => t.slug === 'workshop_library');
  const auditRoomTier = allTiers.find((t) => t.slug === 'audit_room');

  const newVideos = videoList.filter((v) => {
    const ageMs = Date.now() - new Date(v.created_at).getTime();
    return ageMs < 1000 * 60 * 60 * 24 * 30;
  });

  const activeLabels = [...byProduct.keys()].map((p) => PRODUCT_LABELS[p] ?? p);

  return (
    <>
      <AuthHeader />
      <div className="account-shell">
        <div className="account-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>Your Account</h1>
              <p className="sub" style={{ margin: 0 }}>{user.email}</p>
            </div>
            <form action={signOutAction}>
              <button className="btn-ghost" type="submit" style={{ cursor: 'pointer', padding: '10px 18px' }}>
                Sign Out
              </button>
            </form>
          </div>

          {searchParams.saved && <p className="admin-toast ok" style={{ marginTop: 20 }}>Saved</p>}
          {searchParams.error && <p className="admin-toast err" style={{ marginTop: 20 }}>{searchParams.error}</p>}

          {/* ---------- Profile ---------- */}
          <div className="account-module" style={{ marginTop: 28 }}>
            <h2>Profile</h2>
            <form action={updateProfileAction}>
              <div className="admin-row">
                <div className="admin-field">
                  <label htmlFor="full_name">Name</label>
                  <input id="full_name" name="full_name" type="text" defaultValue={profile?.full_name ?? ''} />
                </div>
                <div className="admin-field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={formatPhoneDisplay(profile?.phone) || ''}
                    placeholder="(843) 555-0123"
                  />
                </div>
              </div>
              <button className="admin-btn" type="submit">
                Save Profile
              </button>
            </form>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(243,238,227,.1)' }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--muted-d)', textDecoration: 'underline' }}>
                Change password
              </Link>
              {workshopEntitlement?.stripe_customer_id && (
                <form action="/api/stripe/portal" method="POST" style={{ display: 'inline-block', marginLeft: 20 }}>
                  <button
                    type="submit"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 13,
                      color: 'var(--muted-d)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                  >
                    Manage billing
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ---------- Entitlement status ---------- */}
          <div className="account-module">
            <h2>What You Have Access To</h2>
            {activeLabels.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>Nothing yet — see Ways to Work Together below.</p>
            ) : (
              <ul style={{ listStyle: 'none', color: 'var(--cream)', fontSize: 15, lineHeight: 1.9 }}>
                {activeLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </div>

          {/* ---------- Workshop Library ---------- */}
          <div className="account-module">
            <h2>Workshop Library</h2>
            {workshopEntitlement ? (
              <>
                <p className="sub" style={{ marginBottom: 6 }}>
                  {videoList.length > 0
                    ? `${viewedCount} of ${videoList.length} sessions viewed.`
                    : 'Full access — episodes are added regularly.'}
                </p>
                {newVideos.length > 0 && (
                  <p className="sub" style={{ marginBottom: 16 }}>
                    {newVideos.length} new session{newVideos.length === 1 ? '' : 's'} added in the last 30 days.
                  </p>
                )}
                <Link href="/library" className="btn-primary" style={{ display: 'inline-block' }}>
                  Go to the Library
                </Link>
                {auditRoomTier?.is_visible && (
                  <p style={{ marginTop: 18, fontSize: 13.5, color: 'var(--muted-d)' }}>
                    Next step, when you&apos;re ready:{' '}
                    <Link href={auditRoomTier.cta_href || '/#ladder'} style={{ color: 'var(--gold-bright)', textDecoration: 'underline' }}>
                      {auditRoomTier.title || 'The Audit Room'}
                    </Link>
                    .
                  </p>
                )}
              </>
            ) : workshopTier?.is_visible ? (
              <>
                <p className="sub">
                  The full, uncut version of every session — longer than the free edit, with the parts that
                  didn&apos;t make the public cut.
                </p>
                <a href="/api/checkout/workshop-library" className="btn-primary" style={{ display: 'inline-block' }}>
                  {workshopTier.cta_label || 'Get Access'} — {workshopTier.price_label}
                </a>
              </>
            ) : (
              <Link href="/#ladder" className="btn-ghost" style={{ display: 'inline-block' }}>
                See Ways to Work Together
              </Link>
            )}
          </div>

          {/* ---------- Audit Room / Scoped Engagement / VIP ----------
              These tiers don't have self-serve purchase/registration flows
              yet — an admin grants access by hand and writes the relevant
              details (session date, deliverable link, engagement status)
              in the grant's note, which just renders here as-is. */}
          {(['audit_room', 'scoped_engagement', 'vip'] as const).map((product) => {
            const e = byProduct.get(product);
            if (!e) return null;
            return (
              <div className="account-module" key={product}>
                <h2>{PRODUCT_LABELS[product]}</h2>
                <p className="sub" style={{ marginBottom: e.note ? 12 : 0 }}>
                  Since {formatOrderDate(e.granted_at)}.
                </p>
                {e.note ? (
                  <p style={{ color: 'var(--cream)', fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {e.note}
                  </p>
                ) : (
                  <p className="sub" style={{ margin: 0 }}>
                    Details from your engagement will show up here — reach out if you&apos;re expecting
                    something specific.
                  </p>
                )}
                {product === 'audit_room' && (
                  <form
                    action={updateRosterOptIn}
                    style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(243,238,227,.1)' }}
                  >
                    <label className="admin-checkbox" style={{ color: 'var(--cream)' }}>
                      <input type="checkbox" name="roster_opt_in" defaultChecked={e.roster_opt_in} />
                      Let others in this session see your name
                    </label>
                    <p className="sub" style={{ margin: '6px 0 12px' }}>
                      Off by default. Nothing about your presence in a session is visible to anyone else
                      unless you turn this on.
                    </p>
                    <button className="btn-ghost" type="submit" style={{ padding: '8px 16px', fontSize: 13 }}>
                      Save
                    </button>
                  </form>
                )}
              </div>
            );
          })}

          {/* ---------- Quick Links ---------- */}
          <div className="account-module">
            <h2>Quick Links</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workshopEntitlement && (
                <Link href="/library" style={{ color: 'var(--gold-bright)', fontSize: 14 }}>
                  Workshop Library →
                </Link>
              )}
              <Link href="/#calendar" style={{ color: 'var(--cream)', fontSize: 14 }}>
                Upcoming Free Masterclasses →
              </Link>
              <Link href="/#ladder" style={{ color: 'var(--cream)', fontSize: 14 }}>
                Ways to Work Together →
              </Link>
            </div>
          </div>

          {/* ---------- Order History ---------- */}
          <div className="account-module" id="orders">
            <h2>Order History</h2>
            {orderList.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>No purchases yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderList.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'rgba(243,238,227,.05)',
                      border: '1px solid rgba(243,238,227,.1)',
                      borderRadius: 4,
                      opacity: isActive(order) ? 1 : 0.55,
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 600 }}>
                        {PRODUCT_LABELS[order.product] ?? order.product}
                        {!isActive(order) && (
                          <span style={{ color: 'var(--muted-d)', fontWeight: 500 }}> — revoked</span>
                        )}
                      </div>
                      <div style={{ color: 'var(--muted-d)', fontSize: 12.5, marginTop: 2 }}>
                        {formatOrderDate(order.granted_at)}
                        {order.source === 'manual_admin' ? ' · Manual' : ' · Stripe'}
                      </div>
                    </div>
                    <div style={{ color: 'var(--gold-bright)', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatMoney(order.amount_total, order.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
