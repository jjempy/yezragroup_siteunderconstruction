'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateProfileAction } from '@/app/account/actions';

function initialsFor(fullName: string, email: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}

/** The account page's identity hero — replaces both the old standalone
 * "Your Account" heading and the separate Profile module below it with
 * one moment: an avatar, the user's name (bold — it's the one thing on
 * this page that's actually theirs), and how to reach them. Name/phone
 * stay out of permanently-open <input> fields (that read like an
 * unfinished form) until an explicit Edit click swaps in the editable
 * form, with Cancel back to the display state. */
export function ProfileEditor({
  fullName,
  email,
  phoneDisplay,
  memberSince,
  hasStripeCustomer,
}: {
  fullName: string;
  email: string;
  phoneDisplay: string;
  memberSince: string;
  hasStripeCustomer: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const secondaryLinks = (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgb(from var(--cream) r g b / .1)' }}>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div className="profile-avatar">{initialsFor(fullName, email)}</div>
          <div style={{ flexGrow: 1, minWidth: 180 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cream)', lineHeight: 1.25 }}>
              {fullName || <span style={{ color: 'var(--muted-d)', fontWeight: 500 }}>Add your name</span>}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--muted-d)', marginTop: 3 }}>
              {memberSince ? `Member since ${memberSince} · ` : ''}
              {email}
              {phoneDisplay ? ` · ${phoneDisplay}` : ''}
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
        {secondaryLinks}
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
      {secondaryLinks}
    </form>
  );
}
