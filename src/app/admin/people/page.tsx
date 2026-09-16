import { requireAdmin } from '@/lib/auth';
import { getPeopleForAdmin } from '@/lib/admin-users';
import { PeopleTable } from '@/components/admin/PeopleTable';

export default async function PeopleAdminPage() {
  const { user } = await requireAdmin();
  const { accounts, newsletterOnly } = await getPeopleForAdmin();

  return (
    <>
      <h1>People</h1>
      <p className="sub">
        {accounts.length} registered account{accounts.length === 1 ? '' : 's'}
        {newsletterOnly.length > 0 && (
          <> · {newsletterOnly.length} newsletter-only contact{newsletterOnly.length === 1 ? '' : 's'}</>
        )}
        .{' '}
        <a href="/api/admin/users/export" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          Export Accounts CSV
        </a>
        {' · '}
        <a href="/api/admin/newsletter/export" style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}>
          Export Newsletter CSV
        </a>
      </p>
      <PeopleTable accounts={accounts} newsletterOnly={newsletterOnly} currentUserId={user.id} />
    </>
  );
}
