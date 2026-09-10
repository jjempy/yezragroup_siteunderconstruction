import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from './actions';

export default async function AccountPage() {
  const { user, profile } = await requireUser();
  const supabase = createClient();
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('product, granted_at')
    .eq('user_id', user.id)
    .eq('product', 'workshop_library')
    .maybeSingle();

  return (
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
          {entitlement && (
            <Link href="/library" className="btn-primary" style={{ textAlign: 'center' }}>
              Go to Workshop Library
            </Link>
          )}
          <form action="/api/stripe/portal" method="POST">
            <button className="btn-ghost" type="submit" style={{ width: '100%', cursor: 'pointer' }}>
              Manage Billing
            </button>
          </form>
          <form action={signOutAction}>
            <button className="btn-ghost" type="submit" style={{ width: '100%', cursor: 'pointer' }}>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
