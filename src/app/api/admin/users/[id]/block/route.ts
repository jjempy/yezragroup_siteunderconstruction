import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await requireAdmin();

  const body = await req.json().catch(() => null);
  const blocked = body?.blocked;
  if (typeof blocked !== 'boolean') {
    return NextResponse.json({ error: 'blocked must be a boolean' }, { status: 400 });
  }

  if (params.id === user.id && blocked) {
    return NextResponse.json({ error: "You can't block your own account." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Enforcement: ban_duration on the auth user actually prevents sign-in.
  // 'none' lifts a ban; a very long duration effectively means "permanent"
  // (Supabase's admin API has no literal "forever" value).
  const { error: authError } = await admin.auth.admin.updateUserById(params.id, {
    ban_duration: blocked ? '876000h' : 'none', // ~100 years vs. lifted
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Mirror onto profiles so it's easy to read/display/export alongside
  // name, email, and role without a second admin API round-trip.
  const { error: profileError } = await admin.from('profiles').update({ blocked }).eq('id', params.id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
