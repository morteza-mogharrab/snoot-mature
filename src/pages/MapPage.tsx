import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, CalendarHeart, CheckCircle2, Clock, Copy, Navigation, Phone, Search, Siren, Star, Ticket, X } from 'lucide-react';
import type { Place, PlaceCategory } from '../types';
import { useActions, useDb, useUI } from '../store/AppStore';
import { PLACE_META } from '../data/meta';
import { distanceKm, HOME } from '../utils/geo';
import { fmtDay, timeShort } from '../utils/format';
import { NeighbourhoodMap, type MapMarker } from '../components/map/NeighbourhoodMap';
import { useIsMobile } from '../hooks';
import { TreatIcon } from '../components/ui/Brand';
import { Modal } from '../components/ui/Kit';

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return <span className="stars" aria-label={`${value} out of 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />)}</span>;
}

export function PlaceDetail({ place, onClose }: { place: Place; onClose(): void }) {
  const db = useDb();
  const { checkIn, savePlace, review, redeem } = useActions();
  const { toast } = useUI();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const meta = PLACE_META[place.category];
  const coupon = db.rewards.coupons.find((c) => c.placeId === place.id);
  const events = db.events.filter((e) => e.placeId === place.id);
  return (
    <div className="pd">
      <div className="pd-hero" style={{ background: place.photo ? undefined : `linear-gradient(135deg, ${meta.color}, ${meta.color}aa)` }}>
        {place.photo ? <img src={place.photo.src} alt="" /> : <span className="pd-hero-ico">{meta.icon}</span>}
        <button className="pd-close icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {place.partner && <span className="pd-partner"><CheckCircle2 size={13} /> Snoot partner</span>}
      </div>
      <div className="pd-body">
        <span className="pill" style={{ background: meta.soft, color: meta.color }}>{meta.icon} {meta.label}</span>
        <h2 className="h2" style={{ marginTop: 8 }}>{place.name}</h2>
        <div className="row wrap small muted" style={{ gap: 10, marginTop: 4 }}>
          <span className="row" style={{ gap: 4, color: 'var(--honey)' }}><Stars value={place.rating} /> <b className="ink">{place.rating}</b></span>
          <span>({place.reviewCount})</span>
          <span>{distanceKm(HOME, [place.x, place.y]).toFixed(1)} km away</span>
          {place.priceLevel && <span>{'$'.repeat(place.priceLevel)}</span>}
        </div>
        <p className="row small" style={{ gap: 6, marginTop: 8 }}><Clock size={14} /><b className={place.openNow ? 'open' : 'closed'}>{place.openNow ? 'Open now' : 'Closed'}</b> · {place.hours}</p>
        <p className="muted small" style={{ marginTop: 10 }}>{place.description}</p>
        <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>{place.amenities.map((a) => <span key={a} className="pill">{a}</span>)}</div>
        <div className="pd-actions">
          <button className={`btn ${place.checkedInToday ? 'btn-soft' : 'btn-primary'}`} onClick={() => checkIn(place.id)} disabled={place.checkedInToday}>
            {place.checkedInToday ? <><CheckCircle2 size={16} /> Checked in</> : <>Check in <span className="row" style={{ gap: 3 }}>+5 <TreatIcon size={14} /></span></>}
          </button>
          <button className="btn btn-soft" onClick={() => savePlace(place.id)}><Bookmark size={16} fill={place.saved ? 'currentColor' : 'none'} /> {place.saved ? 'Saved' : 'Save'}</button>
          <button className="btn btn-soft" onClick={() => toast(`Directions: ${distanceKm(HOME, [place.x, place.y]).toFixed(1)} km · about ${Math.round(distanceKm(HOME, [place.x, place.y]) * 13)} min walk`)}><Navigation size={16} /> Directions</button>
          {place.phone && <span className="btn btn-ghost"><Phone size={16} /> {place.phone}</span>}
        </div>
        {place.offer && (
          <div className="offer">
            <Ticket size={22} />
            <div className="grow"><b>{place.offer.title}</b><p className="tiny muted">{place.offer.detail}</p></div>
            {coupon || code ? (
              <button className="coupon-code" onClick={async () => { try { await navigator.clipboard.writeText(code ?? coupon!.code); toast('Code copied'); } catch { /* noop */ } }}><Copy size={13} /> {code ?? coupon!.code}</button>
            ) : (
              <button className="btn btn-dark btn-sm" onClick={() => { const c = redeem(place.id); if (c) { setCode(c); toast('Coupon unlocked'); } }}>{place.offer.cost} <TreatIcon size={14} /></button>
            )}
          </div>
        )}
        {events.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p className="eyebrow">Events here</p>
            {events.map((e) => <Link key={e.id} to={`/events/${e.id}`} className="list-row" style={{ padding: '10px 0' }}><CalendarHeart size={18} /><span className="grow small"><b>{e.title}</b> · {fmtDay(e.start)}</span></Link>)}
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <p className="eyebrow">Reviews</p>
          <form className="review-form" onSubmit={(e) => { e.preventDefault(); review(place.id, rating, text); setText(''); }}>
            <div className="row" style={{ gap: 2 }}>{[1, 2, 3, 4, 5].map((i) => <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`} style={{ color: 'var(--honey)' }}><Star size={20} fill={i <= rating ? 'currentColor' : 'none'} /></button>)}</div>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="How was your visit?" />
            <button className="btn btn-soft btn-sm" disabled={!text.trim()}>Post</button>
          </form>
          {place.reviews.map((r) => (
            <div key={r.id} className="review">
              <img src={db.owners[r.ownerId]?.avatar} alt="" />
              <div className="grow"><div className="between"><b className="small">{db.owners[r.ownerId]?.name}</b><span className="tiny faint">{timeShort(r.createdAt)}</span></div><span style={{ color: 'var(--honey)' }}><Stars value={r.rating} size={12} /></span><p className="small">{r.text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MapPage() {
  const db = useDb();
  const [sp, setSp] = useSearchParams();
  const [cat, setCat] = useState<PlaceCategory | 'all' | 'saved'>('all');
  const [q, setQ] = useState('');
  const [showEvents, setShowEvents] = useState(true);
  const [showLost, setShowLost] = useState(true);
  const [openOnly, setOpenOnly] = useState(false);
  const selected = db.places.find((p) => p.id === sp.get('place'));
  const select = (id?: string) => setSp(id ? { place: id } : {}, { replace: true });
  const { toast } = useUI();
  const isMobile = useIsMobile();

  const places = useMemo(() => db.places
    .filter((p) => cat === 'all' || (cat === 'saved' ? p.saved : p.category === cat))
    .filter((p) => !openOnly || p.openNow)
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.amenities.some((a) => a.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => distanceKm(HOME, [a.x, a.y]) - distanceKm(HOME, [b.x, b.y])), [db.places, cat, q, openOnly]);

  const markers: MapMarker[] = [
    ...places.map((p) => ({ id: p.id, x: p.x, y: p.y, color: PLACE_META[p.category].color, icon: PLACE_META[p.category].icon, label: p.name, active: p.id === selected?.id, onClick: () => select(p.id) })),
    ...(showEvents ? db.events.slice(0, 6).map((e) => { const pl = db.places.find((p) => p.id === e.placeId)!; return { id: `ev-${e.id}`, x: pl.x + 18, y: pl.y - 6, color: '#a65a6b', icon: <CalendarHeart size={15} />, label: e.title, onClick: () => toast(`${e.title} · ${fmtDay(e.start)}`) }; }) : []),
    ...(showLost ? db.lost.filter((l) => l.status === 'lost').map((l) => ({ id: `lost-${l.id}`, x: l.x, y: l.y, color: '#b3261e', icon: <Siren size={15} />, label: `Lost: ${l.petName}`, pulse: true, photo: l.photo.thumb, onClick: () => toast(`Lost: ${l.petName} — see Lost & found`) })) : []),
  ];

  return (
    <div className="mapx">
      <aside className="mapx-panel">
        <h1 className="h2">Nearby</h1>
        <label className="search" style={{ margin: '12px 0' }}><Search size={18} className="faint" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search places or amenities" aria-label="Search places" /></label>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>All</button>
          <button className={`chip ${cat === 'saved' ? 'on' : ''}`} onClick={() => setCat('saved')}><Bookmark size={13} /> Saved</button>
          {(Object.keys(PLACE_META) as PlaceCategory[]).map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}><span style={{ color: cat === c ? undefined : PLACE_META[c].color, display: 'inline-flex' }}>{PLACE_META[c].icon}</span>{PLACE_META[c].plural}</button>)}
        </div>
        <div className="row wrap small" style={{ gap: 14, margin: '12px 2px' }}>
          <label className="row" style={{ gap: 6 }}><input type="checkbox" className="switch" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> Open now</label>
          <label className="row" style={{ gap: 6 }}><input type="checkbox" className="switch" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} /> Events</label>
          <label className="row" style={{ gap: 6 }}><input type="checkbox" className="switch" checked={showLost} onChange={(e) => setShowLost(e.target.checked)} /> Lost pets</label>
        </div>
        <div className="mapx-list">
          {places.map((p) => (
            <button key={p.id} className={`place-row ${selected?.id === p.id ? 'on' : ''}`} onClick={() => select(p.id)}>
              {p.photo ? <img src={p.photo.thumb} alt="" /> : <span className="place-ico" style={{ background: PLACE_META[p.category].color }}>{PLACE_META[p.category].icon}</span>}
              <span className="grow" style={{ textAlign: 'left', lineHeight: 1.35 }}>
                <b className="small">{p.name}</b>
                <span className="tiny muted" style={{ display: 'block' }}>{PLACE_META[p.category].label} · {distanceKm(HOME, [p.x, p.y]).toFixed(1)} km · <span className={p.openNow ? 'open' : 'closed'}>{p.openNow ? 'Open' : 'Closed'}</span></span>
                {p.offer && <span className="tiny offer-tag"><Ticket size={11} /> {p.offer.title}</span>}
              </span>
              <span className="tiny bold row" style={{ gap: 3 }}><Star size={12} fill="var(--honey)" stroke="var(--honey)" />{p.rating}</span>
            </button>
          ))}
          {!places.length && <p className="muted small" style={{ padding: 16 }}>No places match those filters.</p>}
        </div>
      </aside>
      <div className="mapx-map">
        <NeighbourhoodMap markers={markers} height="100%" focus={selected ? [selected.x, selected.y] : undefined} />
        {selected && !isMobile && <div className="pd-float card"><PlaceDetail place={selected} onClose={() => select()} /></div>}
      </div>
      {selected && isMobile && <div className="pd-mobile"><Modal onClose={() => select()} label={selected.name}><PlaceDetail place={selected} onClose={() => select()} /></Modal></div>}
    </div>
  );
}
