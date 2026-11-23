import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { House, Locate, Minus, Plus } from 'lucide-react';
import type { Point } from '../../types';
import { HOME, pathD } from '../../utils/geo';

/**
 * Illustrated map of the fictional Maplewood neighbourhood (1000×700 units).
 * Self-contained so it works offline and inside sandboxed pages. To use a real
 * provider (Leaflet, Mapbox, Google), replace this component and convert map
 * units ↔ lat/lng in one adapter — markers, routes and callbacks stay the same.
 */
export interface MapMarker { id: string; x: number; y: number; color: string; icon: ReactNode; label: string; active?: boolean; pulse?: boolean; onClick?(): void; photo?: string }
export interface MapRoute { points: Point[]; color?: string; dashed?: boolean; width?: number }

const W = 1000;
const H = 700;

const BaseMap = memo(function BaseMap() {
  const streetsH = [120, 190, 330, 500, 560];
  const streetsV = [90, 200, 360, 590, 700, 780];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="nmap-svg" aria-hidden="true">
      <defs>
        <pattern id="trees" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="7" r="4.2" className="m-tree" /><circle cx="16" cy="16" r="3.6" className="m-tree" />
        </pattern>
        <pattern id="waves" width="40" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 8 q10 -6 20 0 t20 0" fill="none" className="m-wave" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect width={W} height={H} className="m-land" />
      {/* blocks */}
      {Array.from({ length: 13 }, (_, i) => Array.from({ length: 9 }, (_, j) => {
        const x = 18 + i * 76 + ((j % 2) * 10);
        const y = 22 + j * 74;
        return <rect key={`${i}-${j}`} x={x} y={y} width={56} height={52} rx={10} className="m-block" />;
      }))}
      {/* sea + beach */}
      <path d="M0 640 C 180 610, 300 660, 470 615 S 800 590, 1000 560 L 1000 700 L 0 700 Z" className="m-sand" />
      <path d="M0 662 C 180 635, 300 682, 470 640 S 800 618, 1000 588 L 1000 700 L 0 700 Z" className="m-sea" />
      <path d="M0 662 C 180 635, 300 682, 470 640 S 800 618, 1000 588 L 1000 700 L 0 700 Z" fill="url(#waves)" opacity=".5" />
      {/* parks */}
      <path d="M215 175 C 260 150, 380 160, 400 210 S 390 320, 330 330 S 200 310, 205 250 Z" className="m-park" />
      <path d="M560 110 C 620 90, 720 110, 740 160 S 700 240, 640 235 S 560 200, 560 110 Z" className="m-park" />
      <path d="M760 220 C 840 190, 980 200, 985 300 S 960 420, 880 410 S 760 360, 760 220 Z" className="m-forest" />
      <path d="M760 220 C 840 190, 980 200, 985 300 S 960 420, 880 410 S 760 360, 760 220 Z" fill="url(#trees)" opacity=".55" />
      <rect x="95" y="305" width="110" height="80" rx="16" className="m-park light" />
      <circle cx="480" cy="560" r="26" className="m-park light" />
      {/* river */}
      <path d="M470 -10 C 520 80, 600 120, 620 200 S 560 330, 600 420 S 690 520, 720 620" className="m-river" />
      <path d="M470 -10 C 520 80, 600 120, 620 200 S 560 330, 600 420 S 690 520, 720 620" className="m-river-hi" />
      {/* streets */}
      {streetsH.map((y) => <path key={`h${y}`} d={`M0 ${y} L ${W} ${y + 8}`} className="m-street minor" />)}
      {streetsV.map((x) => <path key={`v${x}`} d={`M${x} 0 L ${x - 10} ${H}`} className="m-street minor" />)}
      <path d="M0 425 C 250 410, 600 440, 1000 415" className="m-street major" />
      <path d="M485 0 C 478 200, 492 420, 475 700" className="m-street major" />
      <path d="M60 640 C 260 520, 520 470, 940 150" className="m-street major" />
      {/* bridges */}
      <rect x="565" y="413" width="44" height="16" rx="4" className="m-bridge" transform="rotate(-4 587 421)" />
      <rect x="575" y="270" width="40" height="14" rx="4" className="m-bridge" transform="rotate(20 595 277)" />
      {/* labels */}
      <text x="250" y="95" className="m-label">MAPLEWOOD</text>
      <text x="100" y="525" className="m-label">OLD MILL</text>
      <text x="660" y="335" className="m-label">RIVERSIDE</text>
      <text x="830" y="465" className="m-label">CEDAR HILL</text>
      <text x="300" y="612" className="m-label">HARBOURSIDE</text>
      <text x="600" y="455" className="m-street-label" transform="rotate(-2 600 455)">High Street</text>
      <text x="498" y="150" className="m-street-label" transform="rotate(88 498 150)">Elm Street</text>
      <text x="320" y="510" className="m-street-label" transform="rotate(-24 320 510)">Mill Road</text>
      <text x="660" y="225" className="m-street-label" style={{ fontStyle: 'italic' }} transform="rotate(62 660 225)">Silver River</text>
    </svg>
  );
});

export function NeighbourhoodMap({ markers = [], routes = [], dot, home = true, height = 520, focus, interactive = true, className = '' }: {
  markers?: MapMarker[]; routes?: MapRoute[]; dot?: Point; home?: boolean; height?: number | string; focus?: Point; interactive?: boolean; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ sx: number; sy: number; vx: number; vy: number; moved: boolean } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit the 1000×700 map into the box ("cover"), then apply pan/zoom.
  const base = Math.max(size.w / W, size.h / H);
  const k = base * view.k;
  const clamp = (x: number, y: number, kk = k) => ({
    x: Math.min(0, Math.max(size.w - W * kk, x)),
    y: Math.min(0, Math.max(size.h - H * kk, y)),
  });
  const centerOn = (p: Point, kk = view.k) => {
    const kkAbs = base * kk;
    const c = clamp(size.w / 2 - p[0] * kkAbs, size.h / 2 - p[1] * kkAbs, kkAbs);
    setView({ k: kk, x: c.x, y: c.y });
  };
  const fKey = focus ? `${Math.round(focus[0])},${Math.round(focus[1])}` : '';
  useEffect(() => {
    if (focus) centerOn(focus, Math.max(view.k, 1.4));
    else setView((v) => ({ ...v, ...clamp(v.x, v.y) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fKey, size.w, size.h]);

  const zoom = (factor: number, cx = size.w / 2, cy = size.h / 2) => {
    const nk = Math.min(3, Math.max(1, view.k * factor));
    const ka = base * nk;
    const wx = (cx - view.x) / k;
    const wy = (cy - view.y) / k;
    const c = clamp(cx - wx * ka, cy - wy * ka, ka);
    setView({ k: nk, x: c.x, y: c.y });
  };

  return (
    <div ref={box} className={`nmap ${className}`} style={{ height }}
      onWheel={interactive ? (e) => { const r = box.current!.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top); } : undefined}
      onPointerDown={interactive ? (e) => { if ((e.target as HTMLElement).closest('button')) return; drag.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } : undefined}
      onPointerMove={interactive ? (e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        const c = clamp(d.vx + dx, d.vy + dy);
        setView((v) => ({ ...v, ...c }));
      } : undefined}
      onPointerUp={() => { drag.current = null; }}>
      <div className="nmap-layer" style={{ width: W, height: H, transform: `translate(${view.x}px, ${view.y}px) scale(${k})` }}>
        <BaseMap />
        <svg viewBox={`0 0 ${W} ${H}`} className="nmap-svg overlay-svg" aria-hidden="true">
          <defs><linearGradient id="route-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bf5634" /><stop offset="1" stopColor="#bf5634" /></linearGradient></defs>
          {routes.map((r, i) => (
            <g key={i}>
              <path d={pathD(r.points)} fill="none" stroke="#fff" strokeWidth={(r.width ?? 6) + 5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              <path d={pathD(r.points)} fill="none" stroke={r.color ?? 'url(#route-g)'} strokeWidth={r.width ?? 6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.dashed ? '2 12' : undefined} />
            </g>
          ))}
        </svg>
        {home && <span className="m-home" style={{ left: HOME[0], top: HOME[1], transform: `translate(-50%,-50%) scale(${1 / k})` }} title="Home"><House size={16} /></span>}
        {markers.map((m) => (
          <button key={m.id} className={`m-pin ${m.active ? 'on' : ''} ${m.pulse ? 'pulse' : ''}`} style={{ left: m.x, top: m.y, ['--pin' as string]: m.color, transform: `translate(-50%, -100%) scale(${(m.active ? 1.15 : 1) / k})` }}
            onClick={(e) => { e.stopPropagation(); m.onClick?.(); }} aria-label={m.label} title={m.label}>
            {m.photo ? <img src={m.photo} alt="" /> : <span className="m-pin-ico">{m.icon}</span>}
          </button>
        ))}
        {dot && <span className="m-dot" style={{ left: dot[0], top: dot[1], transform: `translate(-50%,-50%) scale(${1 / k})` }} />}
      </div>
      {interactive && (
        <div className="nmap-ctl">
          <button onClick={() => zoom(1.3)} aria-label="Zoom in"><Plus size={18} /></button>
          <button onClick={() => zoom(0.77)} aria-label="Zoom out"><Minus size={18} /></button>
          <button onClick={() => centerOn(dot ?? HOME, 1.6)} aria-label="Centre on me"><Locate size={18} /></button>
        </div>
      )}
      <span className="nmap-attr">Maplewood · illustrated map (sample)</span>
    </div>
  );
}
