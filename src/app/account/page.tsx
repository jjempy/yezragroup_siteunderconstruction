import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuthHeader } from '@/components/AuthHeader';
import { signOutAction } from './actions';

export default async function AccountPage() {
  const { user, profile } = await requireUser();
  const supabase = createClient();
  const [{ data: entitlement }, { data: tier }] = await Promise.all([
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
  ]);

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
          <div style={{ color: 'var(--cream)' }}>{profile?.phone || '—'}</div>
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
      </div>
      </div>
    </>
  );
}
