'use client';

import { useState } from 'react';
import { VIP_REFERRAL_LABELS, VIP_ANNUAL_REVENUE_LABELS } from '@/lib/vip';
import { submitVipApplication } from '@/app/apply-vip/actions';

/** The only genuinely interactive bit of this form — "Who referred
 * you?" only makes sense (and is only required) when "Referred by
 * someone" is selected, so it appears/becomes required dynamically
 * instead of always sitting on the page as a confusing always-visible
 * field. Everything else here is a plain server-action form, same as
 * every other public form in this app. */
export function VipApplicationForm({
  prefillName,
  prefillEmail,
}: {
  prefillName: string;
  prefillEmail: string;
}) {
  const [referralSource, setReferralSource] = useState('other');

  return (
    <form action={submitVipApplication}>
      {/* Honeypot — invisible to real visitors; anything that fills it
          in is a bot. Named "website" rather than "company" since
          Company is a real field on this form. */}
      <div style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required autoComplete="name" defaultValue={prefillName} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={prefillEmail} />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="(843) 555-0123" />
      </div>
      <div className="field">
        <label htmlFor="company">Company (optional)</label>
        <input id="company" name="company" type="text" autoComplete="organization" />
      </div>
      <div className="field">
        <label htmlFor="annual_revenue">Annual Revenue</label>
        <select id="annual_revenue" name="annual_revenue" required defaultValue="">
          <option value="" disabled>
            Select a range…
          </option>
          {Object.entries(VIP_ANNUAL_REVENUE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="referral_source">How did you hear about this?</label>
        <select
          id="referral_source"
          name="referral_source"
          value={referralSource}
          onChange={(e) => setReferralSource(e.target.value)}
        >
          {Object.entries(VIP_REFERRAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {referralSource === 'referred' && (
        <div className="field">
          <label htmlFor="referred_by">Who referred you?</label>
          <input id="referred_by" name="referred_by" type="text" required autoComplete="off" />
        </div>
      )}
      <div className="field">
        <label htmlFor="message">What do you want to work through?</label>
        <textarea id="message" name="message" required rows={6} />
      </div>
      <button className="auth-submit" type="submit">
        Submit Application
      </button>
    </form>
  );
}
