// Shared between the account page, admin manual-grant tool, and the
// Stripe webhook. Keeping the product list/labels in one place means a new
// tier (or a copy change) never has to be updated in more than one spot.

export const ENTITLEMENT_PRODUCTS = ['workshop_library', 'audit_room', 'scoped_engagement', 'vip'] as const;
export type EntitlementProduct = (typeof ENTITLEMENT_PRODUCTS)[number];

export const PRODUCT_LABELS: Record<string, string> = {
  workshop_library: 'Workshop Library — Lifetime Access',
  audit_room: 'The Audit Room',
  scoped_engagement: 'Scoped Engagement',
  vip: 'VIP Intensive',
};

export function isEntitlementProduct(value: string): value is EntitlementProduct {
  return (ENTITLEMENT_PRODUCTS as readonly string[]).includes(value);
}
