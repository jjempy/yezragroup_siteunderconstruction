'use client';

import { useState } from 'react';

/**
 * Wraps the signed-out marketing nav links. On desktop they render inline
 * as before; under the CSS breakpoint (see .nav-burger/.nav-links in
 * globals.css) they collapse behind a hamburger button so the header stays
 * lean on phones instead of just hiding the links with no way to reach
 * them (the old behavior — there was no way to get to Sign In on mobile).
 */
export function MobileNavToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="nav-burger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`nav-links${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        {children}
      </div>
    </>
  );
}
