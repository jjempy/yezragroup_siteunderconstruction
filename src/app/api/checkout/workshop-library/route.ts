import type { NextRequest } from 'next/server';
import { redirectToCheckout } from '@/lib/checkout';

/** GET /api/checkout/workshop-library — the $147 Workshop Library rung's CTA. */
export async function GET(req: NextRequest) {
  return redirectToCheckout(req, 'workshop_library', 'stripe_workshop_library_url');
}
