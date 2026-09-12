import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <div className="app-header">
        <div className="wrap">
          <Link href="/" className="crumb">
            ← Back to site
          </Link>
          <span className="crumb" style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>
            Orchemet Admin
          </span>
        </div>
      </div>
      <div className="admin-layout">
        <AdminNav />
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
