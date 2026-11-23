import type { Point } from '../types';

/** Map units per kilometre on the 1000×700 neighbourhood map. */
export const UNITS_PER_KM = 420;
/** Where Maya lives on the map: walks start and end here. */
export const HOME: Point = [430, 385];

export function routeLength(route: Point[]): number {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
  return d;
}

export const toKm = (units: number) => units / UNITS_PER_KM;

/**
 * A smooth, organic loop starting and ending at HOME — stands in for a GPS track.
 * `seed` varies the shape, `scale` its size.
 */
export function generateLoop(seed: number, scale = 1, steps = 90): Point[] {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const dir = r() * Math.PI * 2;
  const rx = (110 + r() * 90) * scale;
  const ry = (80 + r() * 70) * scale;
  const cx = HOME[0] + Math.cos(dir) * rx;
  const cy = HOME[1] + Math.sin(dir) * ry;
  const wob = [r() * 0.25, r() * 0.2, r() * 6.28, r() * 6.28];
  const start = Math.atan2(HOME[1] - cy, HOME[0] - cx);
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * Math.PI * 2;
    const k = 1 + wob[0] * Math.sin(3 * t + wob[2]) + wob[1] * Math.cos(5 * t + wob[3]);
    let x = cx + Math.cos(t) * rx * k;
    let y = cy + Math.sin(t) * ry * k;
    x = Math.max(30, Math.min(970, x));
    y = Math.max(30, Math.min(670, y));
    pts.push([Math.round(x), Math.round(y)]);
  }
  pts[0] = HOME;
  pts[pts.length - 1] = HOME;
  return pts;
}

/** Point a given distance (map units) along a route, for live tracking. */
export function pointAlong(route: Point[], dist: number): { point: Point; index: number } {
  let acc = 0;
  for (let i = 1; i < route.length; i++) {
    const seg = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
    if (acc + seg >= dist) {
      const t = seg ? (dist - acc) / seg : 0;
      return { point: [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t], index: i };
    }
    acc += seg;
  }
  return { point: route[route.length - 1], index: route.length - 1 };
}

export const pathD = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/** Straight-line distance between two map points, in km. */
export const distanceKm = (a: Point, b: Point) => toKm(Math.hypot(a[0] - b[0], a[1] - b[1]));
