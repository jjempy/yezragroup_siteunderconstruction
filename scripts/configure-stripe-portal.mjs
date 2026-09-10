#!/usr/bin/env node
/**
 * One-time setup script: configures the Stripe Customer Portal's
 * cancellation-reason survey (a few canned reasons + free-text "other"),
 * per the deliverables checklist. Run it once per Stripe account (test
 * mode and live mode separately) after setting STRIPE_SECRET_KEY:
 *
 *   STRIPE_SECRET_KEY=sk_... node scripts/configure-stripe-portal.mjs
 *
 * Nothing today is a subscription, so there's nothing to actually cancel
 * yet — this just makes the portal ready the moment a subscription tier
 * exists, per the "forward-looking" note in the project brief.
 */
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY before running this script.');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: "It's too expensive" },
  { value: 'missing_features', label: "Missing features I need" },
  { value: 'switched_service', label: 'I switched to a different service' },
  { value: 'unused', label: "I don't use it enough" },
  { value: 'other', label: 'Other' },
];

async function main() {
  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Manage your Orchemet subscription',
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'address', 'phone', 'tax_id'],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: CANCELLATION_REASONS.map((r) => r.value),
        },
      },
    },
  });

  console.log('Created Billing Portal configuration:', configuration.id);
  console.log(
    'Set this as the default under Stripe Dashboard → Settings → Billing → Customer portal, ' +
      'or pass configuration id explicitly when creating portal sessions in src/app/api/stripe/portal/route.ts.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
