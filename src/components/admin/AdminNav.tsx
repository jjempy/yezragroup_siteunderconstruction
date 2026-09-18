'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavLink = { href: string; label: string };
type NavEntry = NavLink | { group: string; items: NavLink[] };

// Grouped, not collapsed — every page is still one click away, the
// grouping is just a visual sort so the sidebar reads as sections instead
// of one long undifferentiated list.
const NAV: NavEntry[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/email-previews', label: 'Email Previews' },
  {
    group: 'Site',
    items: [
      { href: '/admin/brand', label: 'Brand' },
      { href: '/admin/content', label: 'Hero & About' },
    ],
  },
  {
    group: 'Offers',
    items: [
      { href: '/admin/offers', label: 'Offers' },
      { href: '/admin/calendar', label: 'Calendar' },
    ],
  },
  {
    group: 'Content',
    items: [
      { href: '/admin/testimonials', label: 'Testimonials' },
      { href: '/admin/videos', label: 'Workshop Videos' },
      { href: '/admin/extended-videos', label: 'Extended Videos' },
    ],
  },
  { href: '/admin/people', label: 'People' },
  { href: '/admin/payments-setup', label: 'Payments Setup' },
];

const ALL_LINKS: NavLink[] = NAV.flatMap((entry) => ('group' in entry ? entry.items : [entry]));

function isCurrent(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

/** Highlights the current section so a click always confirms "you're
 * here" — and on mobile, collapses to a single "current section ▾"
 * button instead of a long stacked list to scroll past every time. */
export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = ALL_LINKS.find((item) => isCurrent(pathname, item.href));

  return (
    <div className="admin-side">
      <button
        type="button"
        className="admin-nav-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{current?.label ?? 'Menu'}</span>
        <span aria-hidden="true">{open ? '▲' : '▾'}</span>
      </button>
      <nav className={`admin-nav-list${open ? ' open' : ''}`}>
        {NAV.map((entry) =>
          'group' in entry ? (
            <div className="admin-nav-group" key={entry.group}>
              <div className="admin-nav-group-label">{entry.group}</div>
              {entry.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item === current ? 'active' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              key={entry.href}
              href={entry.href}
              className={entry === current ? 'active' : undefined}
              onClick={() => setOpen(false)}
            >
              {entry.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
