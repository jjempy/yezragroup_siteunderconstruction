import type { NextRequest } from 'next/server';
import { redirectToCheckout } from '@/lib/checkout';

/** GET /api/checkout/audit-room — the $497 Audit Room rung's CTA. Reuses
 * the stripe_group_masterclass_url settings field (originally meant for a
 * Tally intake form; repointed to hold the direct Stripe Payment Link). */
export async function GET(req: NextRequest) {
  return redirectToCheckout(req, 'audit_room', 'stripe_group_masterclass_url');
}
