import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, renderPurchaseConfirmationEmail, getEmailBranding } from '@/lib/email';
import { PRODUCT_LABELS } from '@/lib/entitlements';

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
  // Optional: sends a one-time purchase confirmation email the first time
  // this (user, product) pair is granted. Omitted by callers that don't
  // have an email handy — that's fine, it just skips the send rather than
  // ever blocking the grant itself over it.
  email?: string | null;
}): Promise<{ error: string | null }> {
  const supabase = createAdminClient();

  // Both the webhook and the success-page self-heal can call this more
  // than once for the same purchase (Stripe retries, a page refresh) —
  // checking for a pre-existing row first is what keeps the confirmation
  // email a one-time send instead of firing on every duplicate call.
  const { data: existing } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', params.userId)
    .eq('product', params.product)
    .maybeSingle();

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

  if (!error && !existing && params.email) {
    const branding = await getEmailBranding();
    await sendEmail({
      to: params.email,
      subject: `Order confirmed: ${PRODUCT_LABELS[params.product] ?? params.product}`,
      html: renderPurchaseConfirmationEmail(
        {
          productLabel: PRODUCT_LABELS[params.product] ?? params.product,
          amountTotal: params.amountTotal,
          currency: params.currency,
        },
        branding
      ),
    });
  }

  return { error: error?.message ?? null };
}
