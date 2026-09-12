import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/library/mark-viewed { paidVideoId }
 *
 * Fire-and-forget from GatedVideoCard when a buyer presses play — powers
 * the flat "6 of 14 sessions viewed" line on the account page. Not
 * gamified progress, just a record of what's actually been opened.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const paidVideoId = body?.paidVideoId as string | undefined;
  if (!paidVideoId) return NextResponse.json({ ok: false }, { status: 400 });

  // Upsert so replaying an already-viewed episode doesn't error on the
  // primary key — the column error is swallowed either way since this is
  // a best-effort UX nicety, never something that should block playback.
  await supabase
    .from('paid_video_views')
    .upsert({ user_id: user.id, paid_video_id: paidVideoId }, { onConflict: 'user_id,paid_video_id' });

  return NextResponse.json({ ok: true });
}
