import { useCallback, useEffect, useRef, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/** Distinguishes single from double taps on media. */
export function useDoubleTap(onDouble: () => void, onSingle?: () => void, delay = 250) {
  const t = useRef<number | undefined>(undefined);
  return useCallback(() => {
    if (t.current) { clearTimeout(t.current); t.current = undefined; onDouble(); }
    else t.current = window.setTimeout(() => { t.current = undefined; onSingle?.(); }, delay);
  }, [onDouble, onSingle, delay]);
}

export function useClickOutside<T extends HTMLElement>(cb: () => void, active = true) {
  const ref = useRef<T>(null);
  const fn = useRef(cb);
  fn.current = cb;
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn.current(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [active]);
  return ref;
}

export function useInfinite(onVisible: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && cb.current(), { rootMargin: '600px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [enabled]);
  return ref;
}

/** Re-render every `ms` (for live clocks/countdowns). */
export function useTick(ms = 1000, active = true) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms, active]);
}
