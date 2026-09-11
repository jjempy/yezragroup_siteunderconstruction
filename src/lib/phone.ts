// The "min" metadata build is meaningfully smaller in the client bundle
// than the full one, at the cost of some rarely-needed data (alternate
// formats for a few countries) — validation/E.164 output is unaffected.
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

/**
 * Normalizes a phone number to E.164 (e.g. "+18438043080") — the standard
 * format every SMS/telephony provider (Twilio, etc.) expects, so CSV
 * exports and future marketing/SMS tooling never have to deal with mixed
 * "(843) 804-3080" / "18438043080" / "+1 843 804 3080" style formatting.
 *
 * Defaults to US when no country code is given (the business's primary
 * market), but correctly recognizes and preserves a real international
 * number if one is entered with a leading "+".
 *
 * Returns null for an empty input (phone is optional) or one that isn't a
 * valid, dialable number — callers should treat null-with-nonempty-input
 * as a validation error.
 */
export function normalizePhone(raw: string): { value: string | null; valid: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, valid: true };

  const parsed = parsePhoneNumberFromString(trimmed, 'US');
  if (!parsed || !parsed.isValid()) {
    return { value: null, valid: false };
  }
  return { value: parsed.number, valid: true }; // parsed.number is E.164
}
