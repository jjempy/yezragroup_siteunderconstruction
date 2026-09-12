'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/brand', label: 'Brand' },
  { href: '/admin/content', label: 'Hero & About' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/ladder', label: 'Ladder Tiers' },
  { href: '/admin/videos', label: 'Workshop Videos' },
  { href: '/admin/extended-videos', label: 'Extended Videos' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/newsletter', label: 'Newsletter Signups' },
  { href: '/admin/payments-setup', label: 'Payments Setup' },
];

/** Highlights the current section so a click always confirms "you're
 * here" — and on mobile, collapses to a single "current section ▾"
 * button instead of a long stacked list to scroll past every time. */
export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV.find((item) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  );

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
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item === current ? 'active' : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
