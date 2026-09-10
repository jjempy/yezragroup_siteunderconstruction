import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await requireAdmin();

  const body = await req.json().catch(() => null);
  const role = body?.role;
  if (role !== 'standard' && role !== 'admin') {
    return NextResponse.json({ error: 'role must be "standard" or "admin"' }, { status: 400 });
  }

  if (params.id === user.id && role !== 'admin') {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ role }).eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
