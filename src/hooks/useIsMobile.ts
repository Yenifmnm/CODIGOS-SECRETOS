import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 900;

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * Debajo de 900px las pantallas renderizan una composición vertical propia,
 * no la vista desktop reescalada.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
