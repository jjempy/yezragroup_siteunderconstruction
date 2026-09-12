import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';
import { signOutAction } from './actions';
import type { Entitlement } from '@/types/database';
import { formatPhoneDisplay } from '@/lib/phone';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PRODUCT_LABELS: Record<string, string> = {
  workshop_library: 'Workshop Library — Lifetime Access',
};

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(amountTotal: number | null, currency: string | null) {
  if (amountTotal == null || !currency) return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
      amountTotal / 100
    );
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const { user, profile } = await requireUser();
  const supabase = createClient();
  const [{ data: entitlement }, { data: tier }, { data: orders }] = await Promise.all([
    supabase
      .from('entitlements')
      .select('product, granted_at')
      .eq('user_id', user.id)
      .eq('product', 'workshop_library')
      .maybeSingle(),
    supabase
      .from('ladder_tiers')
      .select('is_visible, price_label, cta_label')
      .eq('slug', 'workshop_library')
      .maybeSingle(),
    supabase
      .from('entitlements')
      .select('id, product, granted_at, amount_total, currency')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false }),
  ]);
  const orderList = (orders as Pick<Entitlement, 'id' | 'product' | 'granted_at' | 'amount_total' | 'currency'>[]) ?? [];

  return (
    <>
      <AuthHeader />
      <div className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: 140 }}>
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1>Your Account</h1>
        <p className="sub">{user.email}</p>

        <div className="admin-field">
          <label>Name</label>
          <div style={{ color: 'var(--cream)' }}>{profile?.full_name || '—'}</div>
        </div>
        <div className="admin-field">
          <label>Phone</label>
          <div style={{ color: 'var(--cream)' }}>{formatPhoneDisplay(profile?.phone) || '—'}</div>
        </div>
        <div className="admin-field">
          <label>Workshop Library</label>
          <div style={{ color: 'var(--cream)' }}>
            {entitlement ? 'Active — full access' : 'Not purchased yet'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          {entitlement ? (
            <Link href="/library" className="btn-primary" style={{ textAlign: 'center' }}>
              Go to Workshop Library
            </Link>
          ) : tier?.is_visible ? (
            // Reactive to Admin -> Ladder Tiers: reflects whatever price/
            // label is actually configured there, and disappears the
            // moment that tier is toggled off — never a stale hardcoded
            // price or a button pointing at something no longer for sale.
            <a
              href="/api/checkout/workshop-library"
              className="btn-primary"
              style={{ textAlign: 'center' }}
            >
              {tier.cta_label || 'Get Access'} — {tier.price_label}
            </a>
          ) : (
            <Link href="/#ladder" className="btn-ghost" style={{ textAlign: 'center' }}>
              See Ways to Work Together
            </Link>
          )}
          {/* Only shown once there's an actual purchase — a Stripe customer
              only exists after checkout, so this button was guaranteed to
              error for anyone who'd never bought anything. */}
          {entitlement && (
            <form action="/api/stripe/portal" method="POST">
              <button className="btn-ghost" type="submit" style={{ width: '100%' }}>
                Manage Billing
              </button>
            </form>
          )}
          <form action={signOutAction}>
            <button className="btn-ghost" type="submit" style={{ width: '100%', cursor: 'pointer' }}>
              Sign Out
            </button>
          </form>
        </div>

        {/* The nav is deliberately lean once you're signed in (just Account,
            no repeated marketing links) — this is the replacement: quick
            access to the same destinations from here instead. */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(243,238,227,.12)' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-d)', marginBottom: 12 }}>
            Quick Links
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entitlement && (
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

        <div id="orders" style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(243,238,227,.12)' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-d)', marginBottom: 12 }}>
            Order History
          </label>
          {orderList.length === 0 ? (
            <p className="sub" style={{ margin: 0 }}>No purchases yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orderList.map((order) => {
                const amount = formatMoney(order.amount_total, order.currency);
                return (
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
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 600 }}>
                        {PRODUCT_LABELS[order.product] ?? order.product}
                      </div>
                      <div style={{ color: 'var(--muted-d)', fontSize: 12.5, marginTop: 2 }}>
                        {formatOrderDate(order.granted_at)}
                      </div>
                    </div>
                    {amount && (
                      <div style={{ color: 'var(--gold-bright)', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {amount}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
