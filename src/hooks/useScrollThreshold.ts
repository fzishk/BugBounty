import { useEffect, useState } from 'react';

/** True once the window has scrolled past `threshold` pixels. Removes its listener on unmount. */
export function useScrollThreshold(threshold = 400): boolean {
  const [past, setPast] = useState(
    () => typeof window !== 'undefined' && window.scrollY > threshold,
  );

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      // Coalesce bursts of scroll events into one state update per animation frame.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPast(window.scrollY > threshold));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return past;
}
