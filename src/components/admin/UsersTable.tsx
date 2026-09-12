'use client';

import { useState, useTransition } from 'react';
import type { AdminUserRow } from '@/lib/admin-users';

export function UsersTable({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const [rows, setRows] = useState(users);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggleRole(user: AdminUserRow) {
    setError(null);
    const nextRole = user.role === 'admin' ? 'standard' : 'admin';
    const res = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Failed to update role.');
      return;
    }
    startTransition(() => {
      setRows((prev) => prev.map((r) => (r.id === user.id ? { ...r, role: nextRole } : r)));
    });
  }

  async function toggleBlocked(user: AdminUserRow) {
    setError(null);
    const nextBlocked = !user.blocked;
    const res = await fetch(`/api/admin/users/${user.id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: nextBlocked }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Failed to update block status.');
      return;
    }
    startTransition(() => {
      setRows((prev) => prev.map((r) => (r.id === user.id ? { ...r, blocked: nextBlocked } : r)));
    });
  }

  return (
    <div className="admin-card">
      {error && <p className="admin-toast err">{error}</p>}

      {/* Desktop: a normal table. Below ~750px this is hidden entirely in
          favor of the stacked cards further down — a wide multi-column
          table has no good way to fit a phone screen without either
          horizontal scroll or unreadably tiny text, so it gets its own
          narrow layout instead of trying to force the table to comply. */}
      <div className="users-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Last Login</th>
              <th>Role</th>
              <th>Status</th>
              <th>Marketing</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name || '—'}</td>
                <td>{user.email}</td>
                <td>{user.phone || '—'}</td>
                <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
                <td>
                  <span className={`pill role-${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <span className={`pill ${user.blocked ? 'blocked' : 'active'}`}>
                    {user.blocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td>{user.marketing_opt_in ? 'Yes' : 'No'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    className="admin-btn secondary"
                    disabled={isPending || user.id === currentUserId}
                    onClick={() => toggleRole(user)}
                    style={{ marginRight: 8 }}
                  >
                    Make {user.role === 'admin' ? 'Standard' : 'Admin'}
                  </button>
                  <button
                    className={`admin-btn ${user.blocked ? 'secondary' : 'danger'}`}
                    disabled={isPending || user.id === currentUserId}
                    onClick={() => toggleBlocked(user)}
                  >
                    {user.blocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one stacked card per user, no horizontal scroll ever. */}
      <div className="users-card-list">
        {rows.map((user) => (
          <div className="user-card" key={user.id}>
            <div className="user-card-row">
              <strong>{user.full_name || '—'}</strong>
              <span className={`pill role-${user.role}`}>{user.role}</span>
            </div>
            <div className="user-card-line">{user.email}</div>
            {user.phone && <div className="user-card-line">{user.phone}</div>}
            <div className="user-card-line">
              Last login: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
            </div>
            <div className="user-card-row" style={{ marginTop: 6 }}>
              <span className={`pill ${user.blocked ? 'blocked' : 'active'}`}>
                {user.blocked ? 'Blocked' : 'Active'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-l)' }}>
                Marketing: {user.marketing_opt_in ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="user-card-actions">
              <button
                className="admin-btn secondary"
                disabled={isPending || user.id === currentUserId}
                onClick={() => toggleRole(user)}
              >
                Make {user.role === 'admin' ? 'Standard' : 'Admin'}
              </button>
              <button
                className={`admin-btn ${user.blocked ? 'secondary' : 'danger'}`}
                disabled={isPending || user.id === currentUserId}
                onClick={() => toggleBlocked(user)}
              >
                {user.blocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
