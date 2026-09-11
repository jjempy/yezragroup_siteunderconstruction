import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { VideoRow } from '@/types/database';
import { GatedVideoCard } from '@/components/GatedVideoCard';
import { LockedVideoCard } from '@/components/LockedVideoCard';

export default async function LibraryPage() {
  const { user } = await requireUser();
  const supabase = createClient();

  const [{ data: entitlement }, { data: videos }] = await Promise.all([
    supabase
      .from('entitlements')
      .select('product')
      .eq('user_id', user.id)
      .eq('product', 'workshop_library')
      .maybeSingle(),
    supabase.from('videos').select('*').eq('is_visible', true).order('sort_order'),
  ]);

  const isEntitled = Boolean(entitlement);
  const list = (videos as VideoRow[]) ?? [];

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: 60 }}>
      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 100 }}>
        <div className="section-head">
          <div className="eyebrow">Early Access</div>
          <h2>The Workshop Library.</h2>
          <p>
            {isEntitled
              ? 'Everything, unlocked. New episodes appear here first, before they ever reach YouTube.'
              : "Preview every episode below. Unlock full access — $147, one time — to watch the whole library, before any of it reaches YouTube."}
          </p>
          {!isEntitled && (
            <a
              href="/api/checkout/workshop-library"
              className="btn-primary"
              style={{ display: 'inline-block', marginTop: 20 }}
            >
              Unlock Full Access — $147
            </a>
          )}
        </div>
        {list.length > 0 ? (
          <div className="lib-grid">
            {list.map((v, i) =>
              isEntitled ? (
                <GatedVideoCard key={v.id} video={v} index={i} />
              ) : (
                <LockedVideoCard key={v.id} video={v} index={i} />
              )
            )}
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
