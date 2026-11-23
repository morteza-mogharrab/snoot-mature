let seq = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function timeShort(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  if (d < MIN) return 'now';
  if (d < HOUR) return `${Math.floor(d / MIN)}m`;
  if (d < DAY) return `${Math.floor(d / HOUR)}h`;
  if (d < WEEK) return `${Math.floor(d / DAY)}d`;
  return `${Math.floor(d / WEEK)}w`;
}

export function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const p = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'} ago`;
  if (d < MIN) return 'Just now';
  if (d < HOUR) return p(Math.floor(d / MIN), 'minute');
  if (d < DAY) return p(Math.floor(d / HOUR), 'hour');
  if (d < WEEK) return p(Math.floor(d / DAY), 'day');
  return fmtDate(iso);
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-US', opts);
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function untilLabel(iso: string): string {
  const d = new Date(iso).getTime() - Date.now();
  if (d <= 0) return 'Ended';
  if (d < HOUR) return `${Math.ceil(d / MIN)}m left`;
  if (d < DAY) return `${Math.ceil(d / HOUR)}h left`;
  return `${Math.ceil(d / DAY)}d left`;
}

export const fmtNum = (n: number) => n.toLocaleString('en-US');
export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${+(n / 1000).toFixed(1)}K`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  return `${+(n / 1_000_000).toFixed(1)}M`;
}

export function duration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
export const durationWords = (sec: number) => (sec >= 3600 ? `${Math.floor(sec / 3600)}h ${Math.round((sec % 3600) / 60)}m` : `${Math.round(sec / 60)} min`);

/** "1 year", "4 years", "6 months" */
export function ageLabel(birthdayIso: string): string {
  const b = new Date(birthdayIso);
  const n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) months--;
  if (months < 12) return `${Math.max(1, months)} month${months === 1 ? '' : 's'}`;
  const y = Math.floor(months / 12);
  return `${y} year${y === 1 ? '' : 's'}`;
}

/** Days until the next occurrence of a birthday (0 = today). */
export function daysUntilBirthday(birthdayIso: string): { days: number; turning: number } {
  const b = new Date(birthdayIso);
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  const next = new Date(n.getFullYear(), b.getMonth(), b.getDate());
  if (next < n) next.setFullYear(next.getFullYear() + 1);
  return { days: Math.round((next.getTime() - n.getTime()) / DAY), turning: next.getFullYear() - b.getFullYear() };
}

/** Snoot level from XP: each level needs a little more. */
export function levelFromXp(xp: number) {
  let level = 1;
  let need = 200;
  let rest = xp;
  while (rest >= need) { rest -= need; level++; need = Math.round(need * 1.12); }
  return { level, into: rest, need, pct: rest / need };
}

export const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

export function downscaleImage(file: File, max = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unsupported image'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const speciesEmoji: Record<string, string> = { dog: '🐶', cat: '🐱', bird: '🐦', small: '🦔', fish: '🐟' };
