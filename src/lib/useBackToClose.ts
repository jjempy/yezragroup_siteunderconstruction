'use client';

import { useEffect, useRef } from 'react';

/**
 * Makes the mobile back-gesture (or desktop Alt+Left / browser Back)
 * close an inline overlay — like a video swapped in for its thumbnail —
 * instead of navigating off the page entirely. Without this, opening the
 * overlay doesn't add anything for "back" to undo, so the gesture skips
 * straight past it to wherever the visitor was before this page, which
 * reads as the back button "not working" on whatever's currently open.
 *
 * Call with (isOpen, closeFn) — when isOpen flips true, a history entry is
 * pushed; back/swipe-back pops it and calls closeFn instead of leaving.
 */
export function useBackToClose(isOpen: boolean, close: () => void) {
  const pushedRef = useRef(false);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      pushedRef.current = true;
      history.pushState({ __overlay: true }, '');
    }
  }, [isOpen]);

  useEffect(() => {
    function onPopState() {
      if (pushedRef.current) {
        pushedRef.current = false;
        closeRef.current();
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
}
