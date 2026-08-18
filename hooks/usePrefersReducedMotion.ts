import { useEffect, useState } from 'react';

/**
 * Tracks the user's prefers-reduced-motion media query.
 * Defaults to false on the first paint (SSR/extension-safe), then syncs.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();

    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}
