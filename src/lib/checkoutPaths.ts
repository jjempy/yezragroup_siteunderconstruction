// Client-safe (no 'server-only') — imported from both client components
// (signup/login pages) and server code (the auth callback route).

export const CHECKOUT_PATHS: Record<string, string> = {
  workshop_library: '/api/checkout/workshop-library',
  audit_room: '/api/checkout/audit-room',
  scoped_engagement: '/api/checkout/scoped-engagement-deposit',
};

/** Resolves the `redirect` query param carried through signup/login/email
 * confirmation — a product slug ("audit_room"), or the legacy literal
 * "checkout" (meaning workshop_library, from before more than one
 * direct-checkout tier existed) — to where to resume afterward. Anything
 * unrecognized falls back to the account page rather than guessing. */
export function checkoutPathFor(redirectParam: string | null | undefined): string {
  if (!redirectParam) return '/account';
  if (redirectParam === 'checkout') return CHECKOUT_PATHS.workshop_library;
  return CHECKOUT_PATHS[redirectParam] ?? '/account';
}
