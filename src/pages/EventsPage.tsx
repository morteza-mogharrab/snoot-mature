import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CalendarPlus, Check, Clock, MapPin, Plus, Send, Star, Ticket, Users } from 'lucide-react';
import type { EventCategory, PetEvent } from '../types';
import { useActions, useActivePet, useDb, useUI } from '../store/AppStore';
import { EVENT_META } from '../data/meta';
import { fmtDay, fmtTime, uid } from '../utils/format';
import { NeighbourhoodMap } from '../components/map/NeighbourhoodMap';
import { Empty, Modal, ModalHead } from '../components/ui/Kit';
import { SAMPLE_UPLOADS } from '../data/seed';

function RsvpButtons({ e }: { e: PetEvent }) {
  const { rsvp } = useActions();
  return (
    <div className="row">
      <button className={`btn ${e.rsvp === 'going' ? 'btn-mint' : 'btn-primary'}`} onClick={() => rsvp(e.id, e.rsvp === 'going' ? null : 'going')}>
        {e.rsvp === 'going' ? <><Check size={16} /> Going</> : 'I’m going'}
      </button>
      <button className={`btn ${e.rsvp === 'interested' ? 'on' : 'btn-soft'}`} onClick={() => rsvp(e.id, e.rsvp === 'interested' ? null : 'interested')}>
        <Star size={16} fill={e.rsvp === 'interested' ? 'currentColor' : 'none'} /> Interested
      </button>
    </div>
  );
}

export function EventCard({ e }: { e: PetEvent }) {
  const db = useDb();
  const place = db.places.find((p) => p.id === e.placeId);
  const m = EVENT_META[e.category];
  const d = new Date(e.start);
  return (
    <Link to={`/events/${e.id}`} className="ev-card card">
      <div className="ev-cover">
        <img src={e.cover.src} alt="" loading="lazy" />
        <span className="ev-cat" style={{ background: m.color }}>{m.icon} {m.label}</span>
        <span className="ev-cal"><b>{d.getDate()}</b><span>{d.toLocaleDateString('en-US', { month: 'short' })}</span></span>
        {e.rsvp && <span className="ev-rsvp">{e.rsvp === 'going' ? '✓ Going' : '★ Interested'}</span>}
      </div>
      <div className="card-pad" style={{ paddingTop: 14 }}>
        <h3 className="h3 clamp2">{e.title}</h3>
        <p className="tiny muted row" style={{ gap: 6, marginTop: 6 }}><Clock size={12} /> {fmtDay(e.start)} · {fmtTime(e.start)}</p>
        <p className="tiny muted row" style={{ gap: 6, marginTop: 2 }}><MapPin size={12} /> {place?.name}</p>
        <div className="between" style={{ marginTop: 12 }}>
          <span className="avatars-stack">{e.attendeePetIds.slice(0, 4).map((id) => db.pets[id] && <img key={id} src={db.pets[id].avatar} alt="" />)}<span className="tiny muted" style={{ marginLeft: 8 }}>{e.going} going</span></span>
          <span className="pill">{e.price ? `$${e.price}` : 'Free'}</span>
        </div>
      </div>
    </Link>
  );
}

function CreateEvent({ onClose }: { onClose(): void }) {
  const db = useDb();
  const pet = useActivePet();
  const navigate = useNavigate();
  const { createEvent } = useActions();
  const [f, setF] = useState({ title: '', category: 'meetup' as EventCategory, date: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10), time: '10:00', placeId: db.places[0].id, description: '', price: 0 });
  return (
    <Modal onClose={onClose} label="Host an event">
      <ModalHead title="Host an event" onClose={onClose} />
      <form className="modal-body col" style={{ gap: 14 }} onSubmit={(ev) => {
        ev.preventDefault();
        const start = new Date(`${f.date}T${f.time}`).toISOString();
        const id = uid('e');
        createEvent({ id, title: f.title, category: f.category, start, end: new Date(new Date(start).getTime() + 2 * 3600_000).toISOString(), placeId: f.placeId,
          cover: SAMPLE_UPLOADS[Math.floor(Math.random() * SAMPLE_UPLOADS.length)], host: `${pet.name} & ${db.owners[db.meId].name}`, hostPetId: pet.id,
          description: f.description || 'A friendly get-together for local pets and their humans.', going: 1, interested: 0, rsvp: 'going', price: f.price, tags: ['Community'], attendeePetIds: [pet.id] });
        onClose();
        navigate(`/events/${id}`);
      }}>
        <label className="field"><span>Event name</span><input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Sunday Doodle Meetup" /></label>
        <div className="field"><span>Type</span><div className="chips" style={{ flexWrap: 'wrap' }}>{(Object.keys(EVENT_META) as EventCategory[]).map((c) => <button type="button" key={c} className={`chip ${f.category === c ? 'on' : ''}`} onClick={() => setF({ ...f, category: c })}>{EVENT_META[c].icon} {EVENT_META[c].label}</button>)}</div></div>
        <div className="row wrap" style={{ gap: 12 }}>
          <label className="field grow"><span>Date</span><input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
          <label className="field grow"><span>Start</span><input type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></label>
        </div>
        <label className="field"><span>Where</span><select className="select" value={f.placeId} onChange={(e) => setF({ ...f, placeId: e.target.value })}>{db.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="field"><span>Details</span><textarea className="textarea" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="What should people bring? Leads on or off?" /></label>
        <label className="field"><span>Price ($, 0 for free)</span><input type="number" min={0} className="input" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></label>
        <button className="btn btn-primary btn-block" disabled={!f.title.trim()}>Publish event · +20 Treats</button>
      </form>
    </Modal>
  );
}

export function EventsPage() {
  const db = useDb();
  const [cat, setCat] = useState<EventCategory | 'all' | 'mine'>('all');
  const [when, setWhen] = useState<'all' | 'week' | 'weekend'>('all');
  const [creating, setCreating] = useState(false);
  const list = useMemo(() => [...db.events].filter((e) => cat === 'all' || (cat === 'mine' ? !!e.rsvp : e.category === cat)).filter((e) => {
    const d = new Date(e.start);
    if (when === 'week') return d.getTime() - Date.now() < 7 * 86_400_000;
    if (when === 'weekend') return d.getDay() === 0 || d.getDay() === 6;
    return true;
  }).sort((a, b) => a.start.localeCompare(b.start)), [db.events, cat, when]);
  const featured = db.events.find((e) => e.id === 'e7')!;
  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="h1">Events</h1><p>Pack walks, adoption days, shows, training and very good parties near Maplewood.</p></div>
        <button className="btn btn-dark" onClick={() => setCreating(true)}><Plus size={16} /> Host an event</button>
      </div>
      <Link to={`/events/${featured.id}`} className="ev-feature">
        <img src={featured.cover.src} alt="" />
        <div className="ev-feature-text">
          <span className="pill" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>Featured · {fmtDay(featured.start)}</span>
          <h2 className="h1" style={{ color: '#fff' }}>{featured.title}</h2>
          <p style={{ color: 'rgba(255,255,255,.85)' }}>{featured.going} going · {db.places.find((p) => p.id === featured.placeId)?.name}</p>
        </div>
      </Link>
      <div className="between wrap section" style={{ marginTop: 24 }}>
        <div className="chips">
          <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => setCat('all')}>All</button>
          <button className={`chip ${cat === 'mine' ? 'on' : ''}`} onClick={() => setCat('mine')}>My events</button>
          {(Object.keys(EVENT_META) as EventCategory[]).map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{EVENT_META[c].icon} {EVENT_META[c].label}</button>)}
        </div>
        <div className="segmented">{(['all', 'week', 'weekend'] as const).map((w) => <button key={w} className={when === w ? 'on' : ''} onClick={() => setWhen(w)}>{w === 'all' ? 'Any time' : w === 'week' ? 'This week' : 'Weekends'}</button>)}</div>
      </div>
      {list.length ? <div className="grid-auto" style={{ marginTop: 16 }}>{list.map((e) => <EventCard key={e.id} e={e} />)}</div> : <Empty icon={<CalendarDays size={24} strokeWidth={1.75} />} title="No events match" />}
      {creating && <CreateEvent onClose={() => setCreating(false)} />}
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const db = useDb();
  const navigate = useNavigate();
  const { openConversation, sendMessage } = useActions();
  const { toast } = useUI();
  const e = db.events.find((x) => x.id === id);
  if (!e) return <div className="page"><Empty icon={<CalendarDays size={24} strokeWidth={1.75} />} title="Event not found"><Link to="/events" className="btn btn-primary">All events</Link></Empty></div>;
  const place = db.places.find((p) => p.id === e.placeId)!;
  const m = EVENT_META[e.category];
  const pack = e.packId ? db.packs.find((p) => p.id === e.packId) : undefined;
  const invite = () => {
    const friend = db.followingPetIds[0];
    sendMessage(openConversation(friend), '', { eventId: e.id });
    toast(`Invite sent to ${db.pets[friend].name}`);
  };
  return (
    <div className="page-narrow">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      <div className="evd-cover"><img src={e.cover.src} alt="" /><span className="ev-cat" style={{ background: m.color }}>{m.icon} {m.label}</span></div>
      <h1 className="h1" style={{ marginTop: 18 }}>{e.title}</h1>
      <p className="muted" style={{ marginTop: 6 }}>Hosted by <b className="ink">{e.host}</b>{pack && <> · <Link to={`/packs/${pack.id}`} className="link">{pack.icon} {pack.name}</Link></>}</p>
      <div className="evd-facts card card-pad">
        <div className="row"><span className="evd-ico"><Clock size={18} /></span><div><b>{fmtDay(e.start)}</b><p className="tiny muted">{fmtTime(e.start)} – {fmtTime(e.end)}</p></div></div>
        <div className="row"><span className="evd-ico"><MapPin size={18} /></span><div><Link to={`/map?place=${place.id}`} className="bold">{place.name}</Link><p className="tiny muted">{place.address}</p></div></div>
        <div className="row"><span className="evd-ico"><Ticket size={18} /></span><div><b>{e.price ? `$${e.price} per pet` : 'Free'}</b><p className="tiny muted">{e.capacity ? `${e.capacity - e.going} spots left` : 'No booking needed'}</p></div></div>
        <div className="row"><span className="evd-ico"><Users size={18} /></span><div><b>{e.going} going · {e.interested} interested</b><p className="tiny muted">{e.species ? `For ${e.species.join(' & ')}s` : 'All pets welcome'}</p></div></div>
      </div>
      <div className="row wrap" style={{ margin: '18px 0', gap: 10 }}>
        <RsvpButtons e={e} />
        <button className="btn btn-soft" onClick={invite}><Send size={16} /> Invite a friend</button>
        <button className="btn btn-ghost" onClick={() => toast('Added to your calendar')}><CalendarPlus size={16} /> Add to calendar</button>
      </div>
      <p className="pre" style={{ lineHeight: 1.65 }}>{e.description}</p>
      <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>{e.tags.map((t) => <span key={t} className="pill">{t}</span>)}</div>
      <h3 className="h3 section">Who’s going</h3>
      <div className="hscroll" style={{ marginTop: 12 }}>
        {e.attendeePetIds.map((pid) => db.pets[pid] && (
          <Link key={pid} to={`/pet/${db.pets[pid].handle}`} className="pet-tile card"><img src={db.pets[pid].avatar} alt="" /><b>{db.pets[pid].name}</b><span className="tiny muted">{db.pets[pid].breed}</span></Link>
        ))}
      </div>
      <div className="section card" style={{ overflow: 'hidden' }}>
        <NeighbourhoodMap height={260} interactive={false} focus={[place.x, place.y]} markers={[{ id: place.id, x: place.x, y: place.y, color: m.color, icon: m.icon, label: place.name, active: true }]} />
      </div>
    </div>
  );
}
