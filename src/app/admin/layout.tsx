import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/brand', label: 'Brand' },
  { href: '/admin/content', label: 'Hero & About' },
  { href: '/admin/ladder', label: 'Ladder Tiers' },
  { href: '/admin/videos', label: 'Workshop Videos' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/users', label: 'Users' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <div className="app-header">
        <div className="wrap">
          <Link href="/" className="crumb" style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>
            Orchemet Admin
          </Link>
          <Link href="/" className="crumb">
            ← Back to site
          </Link>
        </div>
      </div>
      <div className="admin-layout">
        <div className="admin-side">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
