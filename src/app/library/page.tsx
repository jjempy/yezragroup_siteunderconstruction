import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { VideoRow } from '@/types/database';
import { GatedVideoCard } from '@/components/GatedVideoCard';

export default async function LibraryPage() {
  const { user } = await requireUser();
  const supabase = createClient();

  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('product')
    .eq('user_id', user.id)
    .eq('product', 'workshop_library')
    .maybeSingle();

  if (!entitlement) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Workshop Library</h1>
          <p className="sub">
            This is members-only content. Get full access to every masterclass and workshop, plus
            worksheets, for $147.
          </p>
          <a href="/api/checkout/workshop-library" className="auth-submit" style={{ display: 'block', textAlign: 'center' }}>
            Get Access — $147
          </a>
          <div className="auth-links">
            <Link href="/account">Back to account</Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order');

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: 60 }}>
      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 100 }}>
        <div className="section-head">
          <div className="eyebrow">Early Access</div>
          <h2>The Workshop Library.</h2>
          <p>Everything, unlocked. New episodes appear here first, before they ever reach YouTube.</p>
        </div>
        {videos && videos.length > 0 ? (
          <div className="lib-grid">
            {(videos as VideoRow[]).map((v, i) => (
              <GatedVideoCard key={v.id} video={v} index={i} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted-l)' }}>
            No episodes yet — check back soon, or watch the free public workshop clips on the homepage.
          </p>
        )}
      </div>
    </div>
  );
}
