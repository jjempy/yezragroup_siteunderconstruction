// Client-safe (no 'server-only') — imported from both client components
// (signup/login pages) and server code (the auth callback route).

export const CHECKOUT_PATHS: Record<string, string> = {
  workshop_library: '/api/checkout/workshop-library',
  audit_room: '/api/checkout/audit-room',
  scoped_engagement: '/api/checkout/scoped-engagement-deposit',
};

/** Resolves the `redirect` query param carried through signup/login/email
 * confirmation to where to resume afterward:
 *  - a product slug ("audit_room") — back into that tier's checkout
 *  - the legacy literal "checkout" (workshop_library, from before more
 *    than one direct-checkout tier existed)
 *  - "claim:<product>:<stripeSessionId>" — a purchase that was already
 *    paid for *before* an account existed (someone reached the Stripe
 *    Payment Link directly, or the account gate was skipped some other
 *    way). Rather than restart checkout, this sends them to the success
 *    page with the original Stripe session id, so it can verify the
 *    payment and grant the entitlement to the account they just made.
 * Anything unrecognized falls back to the account page rather than
 * guessing. */
export function checkoutPathFor(redirectParam: string | null | undefined): string {
  if (!redirectParam) return '/account';
  if (redirectParam === 'checkout') return CHECKOUT_PATHS.workshop_library;
  if (redirectParam.startsWith('claim:')) {
    const [, product, sessionId] = redirectParam.split(':');
    if (product && sessionId) {
      return `/checkout/success?product=${encodeURIComponent(product)}&session_id=${encodeURIComponent(sessionId)}`;
    }
  }
  return CHECKOUT_PATHS[redirectParam] ?? '/account';
}
