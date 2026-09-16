import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/** Writes (or reactivates) one entitlement row. Used by both the Stripe
 * webhook and the checkout success page's same-request self-heal — same
 * upsert, same missing-column tolerance, so a purchase is recorded the
 * same way no matter which path grants it first. */
export async function grantEntitlement(params: {
  userId: string;
  product: string;
  sessionId: string;
  customerId: string | null;
  amountTotal: number | null;
  currency: string | null;
  source: string;
}): Promise<{ error: string | null }> {
  const supabase = createAdminClient();
  const grant: Record<string, unknown> = {
    user_id: params.userId,
    product: params.product,
    stripe_checkout_session_id: params.sessionId,
    stripe_customer_id: params.customerId,
    amount_total: params.amountTotal,
    currency: params.currency,
    source: params.source,
  };

  let { error } = await supabase.from('entitlements').upsert(grant, { onConflict: 'user_id,product' });

  // Granting access is the one thing this must never fail to do — if the
  // 0008 migration (amount_total/currency columns) hasn't been run yet,
  // don't let that block the purchase from being honored.
  if (error && error.message.includes('column') && error.message.includes('schema cache')) {
    delete grant.amount_total;
    delete grant.currency;
    ({ error } = await supabase.from('entitlements').upsert(grant, { onConflict: 'user_id,product' }));
  }

  return { error: error?.message ?? null };
}
