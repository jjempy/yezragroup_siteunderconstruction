import Link from 'next/link';

const CARDS = [
  { href: '/admin/analytics', title: 'Analytics', desc: 'Signups, purchases, and revenue — by day, week, month, YTD, or all time.' },
  { href: '/admin/brand', title: 'Brand', desc: 'Logo, colors, fonts.' },
  { href: '/admin/content', title: 'Hero & About', desc: 'Hero copy, about paragraphs, founder photo, contact & social links.' },
  { href: '/admin/testimonials', title: 'Testimonials', desc: 'Real client quotes for the "What Happens in the Room" wall.' },
  { href: '/admin/ladder', title: 'Ladder Tiers', desc: 'Edit copy, price, links, and show/hide each of the five rungs.' },
  { href: '/admin/videos', title: 'Workshop Videos', desc: 'The always-free episodes shown on the homepage — never gated.' },
  { href: '/admin/extended-videos', title: 'Extended Videos', desc: 'The paid-only bonus cut of each session — what the $147 tier unlocks.' },
  { href: '/admin/calendar', title: 'Calendar', desc: 'Manage upcoming masterclass sessions.' },
  { href: '/admin/users', title: 'Users', desc: 'Roles, blocking, and CSV export.' },
  { href: '/admin/newsletter', title: 'Newsletter Signups', desc: 'Lean email capture — export as CSV to migrate into Beehiiv later.' },
  { href: '/admin/payments-setup', title: 'Payments Setup', desc: 'Step-by-step Stripe setup guide — for whenever you need to do this again.' },
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
