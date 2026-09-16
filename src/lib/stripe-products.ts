import 'server-only';

// Every Stripe Price ID this site knows how to sell, mapped to the
// entitlement product it grants. Each is optional — an unset env var just
// means that tier isn't live in Stripe yet, not a crash. Shared between
// the webhook (async grant) and the checkout success page (same-request
// self-heal grant) so the two never drift apart.
export const PRICE_TO_PRODUCT: Record<string, string> = {};
if (process.env.STRIPE_PRICE_WORKSHOP_LIBRARY) {
  PRICE_TO_PRODUCT[process.env.STRIPE_PRICE_WORKSHOP_LIBRARY] = 'workshop_library';
}
if (process.env.STRIPE_PRICE_AUDIT_ROOM) {
  PRICE_TO_PRODUCT[process.env.STRIPE_PRICE_AUDIT_ROOM] = 'audit_room';
}
if (process.env.STRIPE_PRICE_SCOPED_ENGAGEMENT_DEPOSIT) {
  PRICE_TO_PRODUCT[process.env.STRIPE_PRICE_SCOPED_ENGAGEMENT_DEPOSIT] = 'scoped_engagement';
}
