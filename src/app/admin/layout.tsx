import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminSearchBar } from '@/components/admin/AdminSearchBar';
import { BackButton } from '@/components/BackButton';
import { Mark } from '@/components/Mark';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('site_settings')
    .select('logo_url')
    .eq('id', 'default')
    .maybeSingle();

  return (
    <div className="admin-shell">
      <div className="app-header">
        <div className="wrap auth-header-wrap">
          <BackButton className="crumb" />
          <AdminSearchBar />
          <Link href="/" className="crumb site-brand-center" aria-label="Back to homepage">
            {settings?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="" style={{ height: 26, width: 'auto', display: 'block' }} />
            ) : (
              <Mark />
            )}
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
