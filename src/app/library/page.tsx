import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { PaidVideoRow } from '@/types/database';
import { GatedVideoCard } from '@/components/GatedVideoCard';
import { LockedVideoCard } from '@/components/LockedVideoCard';
import { AuthHeader } from '@/components/AuthHeader';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function LibraryPage() {
  const { user } = await requireUser();
  const supabase = createClient();

  const [{ data: entitlement }, { data: videos }, { data: views }] = await Promise.all([
    supabase
      .from('entitlements')
      .select('product, status')
      .eq('user_id', user.id)
      .eq('product', 'workshop_library')
      .maybeSingle(),
    supabase.from('paid_videos').select('*').eq('is_visible', true).order('sort_order'),
    supabase.from('paid_video_views').select('paid_video_id').eq('user_id', user.id),
  ]);

  // A missing `status` column (0010 migration not yet run) reads as
  // undefined here, not 'revoked' — so this stays safely permissive
  // rather than accidentally locking out a real buyer.
  const isEntitled = Boolean(entitlement) && entitlement?.status !== 'revoked';
  const list = (videos as PaidVideoRow[]) ?? [];
  const viewedIds = new Set(((views as { paid_video_id: string }[]) ?? []).map((v) => v.paid_video_id));

  return (
    <>
      <AuthHeader />
      <div style={{ background: 'var(--cream)', minHeight: '100vh', paddingTop: 60 }}>
      <div className="wrap" style={{ paddingTop: 60, paddingBottom: 100 }}>
        <div className="section-head">
          <div className="eyebrow">Early Access</div>
          <h2>The Workshop Library.</h2>
          <p>
            {isEntitled
              ? "The full, uncut version of every session — longer than the free edit, with the parts and insights that didn't make the public cut."
              : 'A short preview of every session below. Get full access — $147, one time — for the longer, less-edited cut with additional insights, on top of everything already free on the homepage.'}
          </p>
          {!isEntitled && (
            <a
              href="/api/checkout/workshop-library"
              className="btn-primary"
              style={{ display: 'inline-block', marginTop: 20 }}
            >
              Get Full Access — $147
            </a>
          )}
        </div>
        {list.length > 0 ? (
          <div className="lib-grid">
            {list.map((v, i) =>
              isEntitled ? (
                <GatedVideoCard key={v.id} video={v} index={i} viewed={viewedIds.has(v.id)} />
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
    </>
  );
}
