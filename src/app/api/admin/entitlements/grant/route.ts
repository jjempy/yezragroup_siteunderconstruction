import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isEntitlementProduct } from '@/lib/entitlements';

/**
 * POST /api/admin/entitlements/grant
 *
 * Manual override for "someone calls, the payment link seemed broken" (or
 * a phone sale, or a comp) — grants (or re-grants/updates) a product
 * entitlement directly, bypassing Stripe entirely. Always marked
 * source: 'manual_admin' so it's clearly distinguishable from a real
 * Stripe purchase in order history and the analytics dashboard.
 */
export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json().catch(() => null);
  const userId = body?.userId as string | undefined;
  const product = body?.product as string | undefined;
  const amountDollars = body?.amountDollars; // number | null | undefined — null/undefined = free/comp
  const note = (body?.note as string | undefined)?.trim() || null;

  if (!userId || !product || !isEntitlementProduct(product)) {
    return NextResponse.json({ error: 'Missing or invalid userId/product.' }, { status: 400 });
  }

  const amount_total =
    typeof amountDollars === 'number' && Number.isFinite(amountDollars) && amountDollars > 0
      ? Math.round(amountDollars * 100)
      : null;

  const admin = createAdminClient();
  const { error } = await admin.from('entitlements').upsert(
    {
      user_id: userId,
      product,
      status: 'active',
      granted_at: new Date().toISOString(),
      source: 'manual_admin',
      amount_total,
      currency: amount_total ? 'usd' : null,
      note,
    },
    { onConflict: 'user_id,product' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
