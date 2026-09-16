'use client';

import { useEffect } from 'react';
import { Mark } from './Mark';

/** The homepage logo/wordmark — sits left-aligned at the top, and once
 * you've scrolled past the hero, slides to the center of the bar and
 * switches from "go home" to "scroll back to top" (there's nowhere else
 * to navigate to, you're already home). Toggles a class on <body> rather
 * than local state so the nav links (a sibling, not a child, of this
 * component) can fade out via plain CSS at the same time — otherwise
 * they'd sit directly underneath the now-centered logo. */
export function ScrollBrand({ logoUrl, brandName }: { logoUrl: string; brandName: string }) {
  useEffect(() => {
    function onScroll() {
      document.body.classList.toggle('nav-scrolled', window.scrollY > 120);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('nav-scrolled');
    };
  }, []);

  return (
    <a
      href="#top"
      className="nav-brand"
      aria-label="Scroll to top"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="brand-logo-img" src={logoUrl} alt="" />
      ) : (
        <Mark />
      )}
      {!logoUrl && <span className="brand-name">{brandName}</span>}
    </a>
  );
}
