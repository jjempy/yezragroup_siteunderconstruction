import 'server-only';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client — server only, never import into a
 * Client Component. Throws a clear error if the secret key isn't set
 * rather than failing obscurely deep inside the Stripe SDK. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set.');
  }
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
}
