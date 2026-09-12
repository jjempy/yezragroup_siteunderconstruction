'use client';

import { useEffect, useRef } from 'react';

/**
 * Wrap a <form> (or anything containing one) with this to warn before the
 * browser/tab closes or navigates away with unsaved edits sitting in the
 * fields — otherwise a changed-but-not-saved field is easy to lose
 * without any warning at all.
 */
export function UnsavedChangesGuard({ children }: { children: React.ReactNode }) {
  const dirtyRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function markDirty() {
      dirtyRef.current = true;
    }
    function markClean() {
      dirtyRef.current = false;
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    }

    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
    el.addEventListener('submit', markClean);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      el.removeEventListener('input', markDirty);
      el.removeEventListener('change', markDirty);
      el.removeEventListener('submit', markClean);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
