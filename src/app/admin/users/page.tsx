import { requireAdmin } from '@/lib/auth';
import { getUsersForAdmin } from '@/lib/admin-users';
import { UsersTable } from '@/components/admin/UsersTable';

export default async function UsersAdminPage() {
  const { user } = await requireAdmin();
  const users = await getUsersForAdmin();

  return (
    <>
      <h1>Users</h1>
      <p className="sub">
        {users.length} registered user{users.length === 1 ? '' : 's'}.{' '}
        <a href="/api/admin/users/export" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          Export CSV
        </a>
      </p>
      <UsersTable users={users} currentUserId={user.id} />
    </>
  );
}
