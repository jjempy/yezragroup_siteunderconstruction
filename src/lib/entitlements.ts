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

// Fixed product -> chart color assignment for the revenue-by-product
// stacked chart. Each hex is a slot from the dataviz skill's validated
// categorical palette (run through its CVD/contrast checker for a
// 5-series adjacent stack — see the Analytics page change notes), taken
// in slot order 1-5 and never reassigned: a product keeps its color
// across every range/filter so the legend never lies about which color
// means what. "other" is the catch-all for any product added later that
// isn't in this list yet, so a new tier never breaks the chart or forces
// a palette re-pick — it just shows up as "Other" until this list is
// updated on purpose.
export const PRODUCT_CHART_COLORS: Record<string, string> = {
  workshop_library: '#2a78d6', // slot 1 — blue
  audit_room: '#eb6834', // slot 2 — orange
  scoped_engagement: '#1baf7a', // slot 3 — aqua
  vip: '#eda100', // slot 4 — yellow
  other: '#e87ba4', // slot 5 — magenta (fallback for future products)
};

export function productChartColor(product: string): string {
  return PRODUCT_CHART_COLORS[product] ?? PRODUCT_CHART_COLORS.other;
}
