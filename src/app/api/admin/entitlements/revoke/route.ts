import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/entitlements/revoke
 *
 * Flips status to 'revoked' rather than deleting the row — keeps the
 * purchase/grant history intact (order history, bookkeeping, analytics)
 * even after access is pulled.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json().catch(() => null);
  const userId = body?.userId as string | undefined;
  const product = body?.product as string | undefined;
  if (!userId || !product) {
    return NextResponse.json({ error: 'Missing userId/product.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('entitlements')
    .update({ status: 'revoked' })
    .eq('user_id', userId)
    .eq('product', product);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
