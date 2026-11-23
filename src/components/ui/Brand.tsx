import type { SVGProps } from 'react';

/** Snoot logo mark: a serif "S" with a terracotta full stop (the nose). Glyph outlined from Instrument Serif. */
const S_GLYPH = 'M184 -9Q164 -9 139.5 -5.0Q115 -1 93.5 5.0Q72 11 60 18Q53 22 49.5 26.5Q46 31 46 42L41 199Q41 219 54 219Q65 219 69 201L78 163Q112 20 205 20Q255 20 284.5 53.5Q314 87 314 148Q314 207 283.5 258.0Q253 309 186 359Q112 412 78.0 461.5Q44 511 44 567Q44 641 95.5 685.5Q147 730 227 730Q257 730 285.0 723.0Q313 716 331 703Q337 699 340.5 694.0Q344 689 344 681L347 530Q347 513 334 513Q325 513 321 527L314 552Q292 629 268.5 664.5Q245 700 201 700Q158 700 132.5 672.0Q107 644 107 593Q107 550 135.0 511.0Q163 472 233 416Q308 355 342.5 298.5Q377 242 377 178Q377 122 352.0 80.0Q327 38 283.5 14.5Q240 -9 184 -9Z';
export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Snoot">
      <rect width="64" height="64" rx="15" fill="var(--ink)" />
      <path transform="translate(18.25 50.54) scale(0.05142 -0.05142)" d={S_GLYPH} fill="var(--bg)" />
      <circle cx="46" cy="47.5" r="3.6" fill="var(--coral)" />
    </svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return <span className="wordmark" style={{ fontSize: size * 1.12 }}>Snoot</span>;
}

/** Our own "boop" icon — a nose. Filled when booped. */
export function BoopIcon({ filled, size = 24, ...rest }: SVGProps<SVGSVGElement> & { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d="M3.5 10.5C3.5 6.6 7.4 4.5 12 4.5s8.5 2.1 8.5 6c0 5-4.6 9.5-8.5 9.5s-8.5-4.5-8.5-9.5z" fill={filled ? 'currentColor' : 'none'} />
      <ellipse cx="8.8" cy="11.2" rx="1.6" ry="2.1" transform="rotate(-18 8.8 11.2)" fill={filled ? 'var(--surface)' : 'currentColor'} stroke="none" />
      <ellipse cx="15.2" cy="11.2" rx="1.6" ry="2.1" transform="rotate(18 15.2 11.2)" fill={filled ? 'var(--surface)' : 'currentColor'} stroke="none" />
    </svg>
  );
}

/** Treat (bone) icon used for the currency. */
export function TreatIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="var(--honey)" d="M7.2 3.6a3 3 0 0 1 2.6 4.4l6.2 6.2a3 3 0 1 1 2 4.8 3 3 0 1 1-4.8 2l-6.2-6.2a3 3 0 1 1-4.4-2.6 3 3 0 0 1 4.6-8.6z" transform="rotate(-8 12 12)" />
    </svg>
  );
}
