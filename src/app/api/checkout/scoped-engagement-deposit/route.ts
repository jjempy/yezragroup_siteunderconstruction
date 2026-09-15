import type { NextRequest } from 'next/server';
import { redirectToCheckout } from '@/lib/checkout';

/** GET /api/checkout/scoped-engagement-deposit — the $2,000 Engagement
 * Deposit that reserves a Scoped Engagement, credited toward the total
 * project fee. The remaining balance is collected separately by wire/ACH
 * once the engagement is scoped — see the entitlement's note field, which
 * the admin fills in and which renders on the client's account page.
 * Reuses the scoped_engagement_url settings field (originally meant for
 * an Airtable intake form; repointed to hold the Stripe Payment Link). */
export async function GET(req: NextRequest) {
  return redirectToCheckout(req, 'scoped_engagement', 'scoped_engagement_url');
}
