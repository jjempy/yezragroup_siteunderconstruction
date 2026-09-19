'use client';

import { VIP_STATUS_LABELS } from '@/lib/vip';
import { updateVipApplicationStatus } from '@/app/admin/vip-applications/actions';

/** Auto-submits on change (no separate Save button) — event handlers
 * need a Client Component, which is the only reason this one exists
 * apart from the server-rendered list around it. */
export function VipStatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={updateVipApplicationStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="admin-btn secondary"
        style={{
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          color: status === 'new' ? 'var(--gold-deep)' : 'var(--charcoal)',
        }}
      >
        {Object.entries(VIP_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
