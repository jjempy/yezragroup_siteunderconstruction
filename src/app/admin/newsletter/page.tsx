import { createClient } from '@/lib/supabase/server';

export default async function NewsletterAdminPage() {
  const supabase = createClient();
  const { count } = await supabase
    .from('newsletter_signups')
    .select('*', { count: 'exact', head: true });

  return (
    <>
      <h1>Newsletter Signups</h1>
      <p className="sub">
        A lean, temporary capture — every email from the homepage "Stay In The Loop" form lands here.
        This is meant to be replaced by a real ESP (Beehiiv) once that account exists; export the CSV
        below and import it there whenever you're ready. No unsubscribe flow or sending happens from
        here — it's storage only.
      </p>
      <div className="admin-card">
        <h2>{count ?? 0} signup{count === 1 ? '' : 's'}</h2>
        <a href="/api/admin/newsletter/export" className="admin-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Export CSV
        </a>
      </div>
    </>
  );
}
