import type { Point } from '../../types';
import { pathD } from '../../utils/geo';

/** A tiny route sketch, scaled to fit, for walk cards. */
export function MiniRoute({ route, size = 64, stroke = 'url(#mr-g)', bg = true }: { route: Point[]; size?: number; stroke?: string; bg?: boolean }) {
  const xs = route.map((p) => p[0]);
  const ys = route.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const pad = 8;
  const k = (size - pad * 2) / span;
  const ox = (size - (maxX - minX) * k) / 2;
  const oy = (size - (maxY - minY) * k) / 2;
  const pts = route.map(([x, y]) => [ox + (x - minX) * k, oy + (y - minY) * k] as Point);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mini-route" aria-hidden="true">
      <defs><linearGradient id="mr-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bf5634" /><stop offset="1" stopColor="#bf5634" /></linearGradient></defs>
      {bg && <rect width={size} height={size} rx={size / 4} fill="rgba(255,255,255,.92)" />}
      <path d={pathD(pts)} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[0][0]} cy={pts[0][1]} r={3.5} fill="#161616" />
    </svg>
  );
}
