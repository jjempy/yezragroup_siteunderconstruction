import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';
import { signOutAction, updateRosterOptIn } from './actions';
import type { Entitlement, LadderTier, PaidVideoRow } from '@/types/database';
import { formatPhoneDisplay } from '@/lib/phone';
import { PRODUCT_LABELS } from '@/lib/entitlements';
import { LocalTimestamp } from '@/components/LocalTimestamp';
import { ProfileEditor } from '@/components/ProfileEditor';

// The old default copy ("Details from your engagement will show up here")
// read the same whether someone had paid a full deposit or nothing at
// all — most misleadingly, Scoped Engagement showed up looking like full
// access when it's actually just the $2,000 deposit, before any scoping
// call has happened. Each tier now says plainly what stage they're
// actually at when the admin hasn't added a specific note yet.
const ENTITLEMENT_STATUS_COPY: Record<string, string> = {
  audit_room: 'Seat reserved. Session date and details will show up here once scheduled.',
  scoped_engagement:
    "Deposit received — this reserves your engagement, it isn't full access yet. We'll reach out personally to scope the work; the engagement details and remaining-balance plan will show up here once that's set.",
  vip: 'Application received. Details will show up here once next steps are confirmed.',
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

  const [{ data: entitlementRows }, { data: tiers }, { data: paidVideos }, { data: views }, { data: settings }] =
    await Promise.all([
      supabase.from('entitlements').select('*').eq('user_id', user.id).order('granted_at', { ascending: false }),
      supabase.from('ladder_tiers').select('*'),
      supabase.from('paid_videos').select('*').eq('is_visible', true).order('sort_order'),
      supabase.from('paid_video_views').select('paid_video_id').eq('user_id', user.id),
      supabase.from('site_settings').select('logo_url').eq('id', 'default').maybeSingle(),
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

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  // Tappable shortcuts to what someone actually came here to do —
  // replaces the old standalone "Quick Links" text-link module.
  // Billing isn't here: it's a POST-form action (the Stripe portal
  // redirect), not a plain link, so it stays as the "Manage billing"
  // text link under the profile hero instead of an awkward form-in-a-
  // grid-tile.
  const tiles: { href: string; label: string; icon: React.ReactNode }[] = [];
  if (workshopEntitlement) {
    tiles.push({
      href: '/library',
      label: 'Library',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    });
  }
  tiles.push({
    href: '/#calendar',
    label: 'Masterclasses',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  });
  tiles.push({
    href: '/#ladder',
    label: 'Work Together',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
        <path d="M12 2 3 7l9 5 9-5-9-5z" />
        <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
      </svg>
    ),
  });

  return (
    <>
      <AuthHeader logoUrl={settings?.logo_url} />
      <div className="account-shell">
        <div className="account-content">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 8 }}>
            {/* Account is the landing page after sign-in for everyone,
                admins included — without this, reaching the admin
                panel meant going all the way back to the homepage
                first just to click its nav link. */}
            {profile?.role === 'admin' && (
              <Link href="/admin" className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
                Admin Panel
              </Link>
            )}
            <form action={signOutAction}>
              <button className="btn-ghost" type="submit" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}>
                Sign Out
              </button>
            </form>
          </div>

          {searchParams.saved && <p className="admin-toast ok" style={{ marginBottom: 20 }}>Saved</p>}
          {searchParams.error && <p className="admin-toast err" style={{ marginBottom: 20 }}>{searchParams.error}</p>}

          {/* ---------- Identity + shortcuts ---------- */}
          <div className="account-module" style={{ marginTop: 0 }}>
            <ProfileEditor
              fullName={profile?.full_name ?? ''}
              email={user.email ?? ''}
              phoneDisplay={formatPhoneDisplay(profile?.phone) || ''}
              memberSince={memberSince}
              hasStripeCustomer={Boolean(workshopEntitlement?.stripe_customer_id)}
            />
            <div className="account-tiles">
              {tiles.map((tile) => (
                <Link key={tile.label} href={tile.href} className="account-tile">
                  <div className="account-tile-icon primary">{tile.icon}</div>
                  <span className="account-tile-label">{tile.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ---------- Workshop Library ---------- */}
          {workshopEntitlement ? (
            <div className="account-module">
              <h2>Workshop Library</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)' }}>
                  {videoList.length > 0 ? `${viewedCount} of ${videoList.length} sessions viewed` : 'Full access'}
                </span>
                <span className="status-pill active">Active</span>
              </div>
              {videoList.length > 0 && (
                <div className="progress-track" style={{ marginBottom: 10 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, Math.round((viewedCount / videoList.length) * 100))}%` }}
                  />
                </div>
              )}
              {newVideos.length > 0 && (
                <p className="sub" style={{ margin: 0 }}>
                  {newVideos.length} new session{newVideos.length === 1 ? '' : 's'} added in the last 30 days.
                </p>
              )}
              {auditRoomTier?.is_visible && (
                <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--muted-d)' }}>
                  Next step, when you&apos;re ready:{' '}
                  <Link href={auditRoomTier.cta_href || '/#ladder'} style={{ color: 'var(--gold-bright)', textDecoration: 'underline' }}>
                    {auditRoomTier.title || 'The Audit Room'}
                  </Link>
                  .
                </p>
              )}
            </div>
          ) : workshopTier?.is_visible ? (
            <div className="account-module">
              <h2>Workshop Library</h2>
              <p className="sub">
                The full, uncut version of every session — longer than the free edit, with the parts that
                didn&apos;t make the public cut.
              </p>
              <a href="/api/checkout/workshop-library" className="btn-primary" style={{ display: 'inline-block' }}>
                {workshopTier.cta_label || 'Get Access'} — {workshopTier.price_label}
              </a>
            </div>
          ) : null}

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
                  Since <LocalTimestamp iso={e.granted_at} variant="date" />.
                </p>
                {e.note ? (
                  <p style={{ color: 'var(--cream)', fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {e.note}
                  </p>
                ) : (
                  <p className="sub" style={{ margin: 0 }}>
                    {ENTITLEMENT_STATUS_COPY[product]}{' '}
                    <Link
                      href={`/contact?context=order_purchase&email=${encodeURIComponent(user.email ?? '')}`}
                      style={{ color: 'var(--gold-bright)', textDecoration: 'underline' }}
                    >
                      Expecting something specific?
                    </Link>
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

          {/* ---------- Order History ---------- */}
          <div className="account-module" id="orders">
            <h2>Order History</h2>
            {orderList.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>No purchases yet.</p>
            ) : (
              <div style={{ margin: '0 -30px' }}>
                {orderList.map((order) => (
                  <div key={order.id} className="order-row" style={{ opacity: isActive(order) ? 1 : 0.55 }}>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 600 }}>
                        {PRODUCT_LABELS[order.product] ?? order.product}
                        {!isActive(order) && (
                          <span style={{ color: 'var(--muted-d)', fontWeight: 500 }}> — revoked</span>
                        )}
                      </div>
                      <div style={{ color: 'var(--muted-d)', fontSize: 12.5, marginTop: 2 }}>
                        <LocalTimestamp iso={order.granted_at} variant="date" />
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
            <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>
              Missing a purchase, or something looks wrong?{' '}
              <Link
                href={`/contact?context=order_purchase&email=${encodeURIComponent(user.email ?? '')}`}
                style={{ color: 'var(--gold-bright)', textDecoration: 'underline' }}
              >
                Let us know
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
