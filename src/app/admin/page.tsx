import Link from 'next/link';

const CARDS = [
  { href: '/admin/brand', title: 'Brand', desc: 'Logo, colors, fonts.' },
  { href: '/admin/content', title: 'Hero & About', desc: 'Hero copy, about paragraphs, founder photo, contact & social links.' },
  { href: '/admin/ladder', title: 'Ladder Tiers', desc: 'Edit copy, price, links, and show/hide each of the five rungs.' },
  { href: '/admin/videos', title: 'Workshop Videos', desc: 'Add, edit, reorder, or remove Workshop Library episodes.' },
  { href: '/admin/calendar', title: 'Calendar', desc: 'Manage upcoming masterclass sessions.' },
  { href: '/admin/users', title: 'Users', desc: 'Roles, blocking, and CSV export.' },
];

export default function AdminDashboard() {
  return (
    <>
      <h1>Admin</h1>
      <p className="sub">Everything that used to live in the CONFIG object now lives here.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="admin-card" style={{ display: 'block' }}>
            <h2>{c.title}</h2>
            <p style={{ color: 'var(--muted-l)', fontSize: 13.5 }}>{c.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
