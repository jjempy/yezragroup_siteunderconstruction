'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateProfileAction } from '@/app/account/actions';

/** Name/phone used to be permanently-open <input> fields sitting in
 * default browser chrome — every visit read like an unfinished form
 * waiting to be submitted, on the one page that's actually the user's
 * own space. This shows plain text by default (name bold and
 * prominent, since it's literally the one thing on this page that's
 * theirs) and only becomes an editable form after an explicit Edit
 * click, with a Cancel back to the display state. */
export function ProfileEditor({
  fullName,
  phoneDisplay,
  hasStripeCustomer,
}: {
  fullName: string;
  phoneDisplay: string;
  hasStripeCustomer: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const billingLink = (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(243,238,227,.1)' }}>
      <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--muted-d)', textDecoration: 'underline' }}>
        Change password
      </Link>
      {hasStripeCustomer && (
        <form action="/api/stripe/portal" method="POST" style={{ display: 'inline-block', marginLeft: 20 }}>
          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 13,
              color: 'var(--muted-d)',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Manage billing
          </button>
        </form>
      )}
    </div>
  );

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--cream)', lineHeight: 1.3 }}>
              {fullName || <span style={{ color: 'var(--muted-d)', fontWeight: 500 }}>Add your name</span>}
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted-d)', marginTop: 4 }}>
              {phoneDisplay || 'Add a phone number'}
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
        {billingLink}
      </div>
    );
  }

  return (
    <form action={updateProfileAction}>
      <div className="admin-row">
        <div className="admin-field">
          <label htmlFor="full_name">Name</label>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input id="full_name" name="full_name" type="text" defaultValue={fullName} autoFocus />
        </div>
        <div className="admin-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" defaultValue={phoneDisplay} placeholder="(843) 555-0123" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="admin-btn" type="submit">
          Save Profile
        </button>
        <button type="button" className="btn-ghost" style={{ padding: '10px 18px' }} onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
      {billingLink}
    </form>
  );
}
