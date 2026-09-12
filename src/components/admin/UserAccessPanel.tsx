'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ENTITLEMENT_PRODUCTS, PRODUCT_LABELS, type EntitlementProduct } from '@/lib/entitlements';
import type { AdminUserEntitlement } from '@/lib/admin-users';

/**
 * Manual access control for one user — "someone calls, their payment
 * link seemed broken, comp them or record a phone sale." Grant/revoke any
 * tier directly, with an optional $ amount (for bookkeeping/analytics —
 * blank means free/comped) and a note (shown to the client on their
 * account page for the three tiers that don't have real self-serve
 * purchase flows yet: Audit Room, Scoped Engagement, VIP).
 */
export function UserAccessPanel({
  userId,
  entitlements,
}: {
  userId: string;
  entitlements: AdminUserEntitlement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<EntitlementProduct>('workshop_library');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const byProduct = new Map(entitlements.map((e) => [e.product, e]));
  const activeOnes = ENTITLEMENT_PRODUCTS.map((p) => byProduct.get(p)).filter(
    (e): e is AdminUserEntitlement => Boolean(e)
  );

  async function grant() {
    setError(null);
    const res = await fetch('/api/admin/entitlements/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        product,
        amountDollars: amount ? Number(amount) : null,
        note: note || null,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Failed to grant access.');
      return;
    }
    setAmount('');
    setNote('');
    startTransition(() => router.refresh());
  }

  async function revoke(p: string) {
    setError(null);
    const res = await fetch('/api/admin/entitlements/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, product: p }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Failed to revoke access.');
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ background: 'var(--card)', borderRadius: 6, padding: 16, marginTop: 8 }}>
      {error && (
        <p className="admin-toast err" style={{ fontSize: 13, margin: '0 0 10px' }}>
          {error}
        </p>
      )}

      {activeOnes.length === 0 ? (
        <p className="hint" style={{ marginBottom: 12 }}>No access granted yet.</p>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {activeOnes.map((e) => (
            <div
              key={e.product}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                padding: '7px 0',
                borderBottom: '1px solid var(--line-l)',
              }}
            >
              <div>
                <strong>{PRODUCT_LABELS[e.product] ?? e.product}</strong>{' '}
                <span className={`pill ${e.status === 'active' ? 'active' : 'blocked'}`}>{e.status}</span>{' '}
                <span style={{ color: 'var(--muted-l)' }}>
                  {e.source === 'manual_admin' ? 'Manual' : 'Stripe'}
                  {e.amount_total != null ? ` · $${(e.amount_total / 100).toFixed(2)}` : ' · free/comped'}
                </span>
                {e.note && (
                  <div style={{ color: 'var(--muted-l)', fontSize: 12, marginTop: 2 }}>&ldquo;{e.note}&rdquo;</div>
                )}
              </div>
              {e.status === 'active' && (
                <button
                  className="admin-btn danger"
                  disabled={isPending}
                  onClick={() => revoke(e.product)}
                  style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted-l)', marginBottom: 4 }}>
            Grant / Update Access
          </label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as EntitlementProduct)}
            style={{ padding: 7, fontSize: 13, borderRadius: 4, border: '1px solid var(--line-l)' }}
          >
            {ENTITLEMENT_PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {PRODUCT_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted-l)', marginBottom: 4 }}>
            Amount $ (blank = free)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 90, padding: 7, fontSize: 13, borderRadius: 4, border: '1px solid var(--line-l)' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted-l)', marginBottom: 4 }}>
            Note {['audit_room', 'scoped_engagement', 'vip'].includes(product) ? '(shown to client)' : '(internal)'}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Phone sale, paid by check #1204…"
            style={{ width: '100%', padding: 7, fontSize: 13, borderRadius: 4, border: '1px solid var(--line-l)' }}
          />
        </div>
        <button className="admin-btn" disabled={isPending} onClick={grant} style={{ padding: '8px 16px', fontSize: 13 }}>
          Grant Access
        </button>
      </div>
    </div>
  );
}
