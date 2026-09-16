import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminSearchBar } from '@/components/admin/AdminSearchBar';
import { BackButton } from '@/components/BackButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <div className="app-header">
        <div className="wrap auth-header-wrap">
          <BackButton className="crumb" />
          <AdminSearchBar />
          <Link href="/" className="crumb site-brand-center" style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>
            Orchemet Admin
          </Link>
        </div>
      </div>
      <div className="admin-layout">
        <AdminNav />
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
