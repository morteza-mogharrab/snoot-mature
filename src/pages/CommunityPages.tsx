import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Camera, Check, Crown, Eye, Heart, House, MapPin, Phone, Plus, Siren, Trophy } from 'lucide-react';
import type { LostAlert, Species } from '../types';
import { useActions, useActivePet, useDb, useUI } from '../store/AppStore';
import { postsByPet } from '../store/selectors';
import { downscaleImage, timeAgo, uid, untilLabel } from '../utils/format';
import { NeighbourhoodMap } from '../components/map/NeighbourhoodMap';
import { Empty, Modal, ModalHead } from '../components/ui/Kit';

// =================================================================== Contests
export function ContestsPage() {
  const db = useDb();
  const pet = useActivePet();
  const { vote, enterContest } = useActions();
  const { openComposer } = useUI();
  const [entering, setEntering] = useState<string | null>(null);
  const live = db.contests.filter((c) => new Date(c.endsAt).getTime() > Date.now());
  const past = db.contests.filter((c) => new Date(c.endsAt).getTime() <= Date.now());
  const myPosts = postsByPet(db, pet.id).filter((p) => p.petId === pet.id);
  return (
    <div className="page">
      <div className="page-head"><div><h1 className="h1">Contests</h1><p>Weekly photo contests voted by the community. One vote per contest — you can move it until voting closes.</p></div></div>
      {live.map((c) => {
        const sorted = [...c.entries].sort((a, b) => b.votes - a.votes);
        const total = c.entries.reduce((s, e) => s + e.votes, 0);
        return (
          <section key={c.id} className="contest card" style={{ ['--cc' as string]: c.color }}>
            <header className="contest-head">
              <div className="grow">
                <span className="pill" style={{ background: 'color-mix(in srgb, var(--cc) 18%, transparent)', color: 'var(--cc)' }}><Trophy size={12} /> {untilLabel(c.endsAt)}</span>
                <h2 className="h2" style={{ marginTop: 8 }}>{c.title}</h2>
                <p className="muted small">{c.theme} · Prize: <b className="ink">{c.prize}</b></p>
              </div>
              {c.enteredPetId === pet.id
                ? <span className="pill mint"><Check size={12} /> {pet.name} entered</span>
                : <button className="btn btn-primary" onClick={() => setEntering(c.id)}><Plus size={16} /> Enter {pet.name}</button>}
            </header>
            <div className="entries">
              {sorted.map((e, i) => {
                const p = db.pets[e.petId];
                const voted = c.votedEntryId === e.id;
                return (
                  <article key={e.id} className={`entry ${voted ? 'voted' : ''}`}>
                    <div className="entry-img"><img src={e.media.src} alt="" loading="lazy" />{i < 3 && <span className={`entry-rank r${i + 1}`}>{i === 0 ? <Crown size={14} /> : `#${i + 1}`}</span>}</div>
                    <div className="entry-body">
                      <Link to={`/pet/${p.handle}`} className="row" style={{ gap: 8 }}><img src={p.avatar} alt="" className="entry-av" /><b className="small">{p.name}</b></Link>
                      <div className="entry-bar"><span style={{ width: `${(e.votes / (sorted[0].votes || 1)) * 100}%` }} /></div>
                      <div className="between"><span className="tiny muted">{e.votes.toLocaleString()} votes · {Math.round((e.votes / total) * 100)}%</span>
                        <button className={`btn btn-sm ${voted ? 'btn-mint' : 'btn-soft'}`} onClick={() => vote(c.id, e.id)} disabled={db.owners[db.meId].petIds.includes(e.petId)}>
                          <Heart size={14} fill={voted ? 'currentColor' : 'none'} /> {voted ? 'Voted' : 'Vote'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      {past.length > 0 && (
        <section className="section">
          <h2 className="h3" style={{ marginBottom: 12 }}>Hall of fame</h2>
          <div className="grid-auto">
            {past.map((c) => { const w = [...c.entries].sort((a, b) => b.votes - a.votes)[0]; const p = db.pets[w.petId]; return (
              <Link key={c.id} to={`/pet/${p.handle}`} className="fame card"><img src={w.media.src} alt="" /><div className="fame-text"><span className="pill honey"><Crown size={12} /> Winner</span><b className="h3">{p.name}</b><span className="small">{c.title} · {w.votes.toLocaleString()} votes</span></div></Link>
            ); })}
          </div>
        </section>
      )}
      {entering && (
        <Modal onClose={() => setEntering(null)} label="Enter contest">
          <ModalHead title={`Pick ${pet.name}’s entry`} onClose={() => setEntering(null)} />
          <div className="modal-body">
            {myPosts.length ? <div className="pick-grid">{myPosts.map((p) => <button key={p.id} onClick={() => { enterContest(entering, p.id); setEntering(null); }}><img src={p.media[0].thumb ?? p.media[0].src} alt="" /></button>)}</div>
              : <Empty icon={<Camera size={24} strokeWidth={1.75} />} title={`${pet.name} has no posts yet`} />}
            <button className="btn btn-soft btn-block" style={{ marginTop: 14 }} onClick={() => { const id = entering; setEntering(null); openComposer({ contestId: id }); }}><Camera size={16} /> Upload a new photo instead</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =================================================================== Adopt
export function AdoptPage() {
  const db = useDb();
  const { favoriteAdopt, applyAdopt } = useActions();
  const [species, setSpecies] = useState<Species | 'all'>('all');
  const [size, setSize] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ home: 'House with garden', other: '', note: '' });
  const list = db.adoption.filter((a) => (species === 'all' || a.species === species) && (size === 'all' || a.size === size)).sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const sel = db.adoption.find((a) => a.id === open);
  return (
    <div className="page">
      <div className="adopt-hero">
        <div>
          <p className="eyebrow" style={{ color: 'var(--mint)' }}>Adopt, don’t shop</p>
          <h1 className="h1">{db.adoption.length} pets near Maplewood are looking for a sofa to call their own</h1>
          <p className="muted">Every listing comes from a verified local shelter. Request a meet-and-greet in two taps.</p>
        </div>
        <div className="adopt-hero-pics">{db.adoption.slice(0, 3).map((a) => <img key={a.id} src={a.photo.thumb} alt="" />)}</div>
      </div>
      <div className="row wrap section" style={{ gap: 10, marginTop: 22 }}>
        <div className="chips">{(['all', 'dog', 'cat'] as const).map((s) => <button key={s} className={`chip ${species === s ? 'on' : ''}`} onClick={() => setSpecies(s)}>{s === 'all' ? 'All' : `${s === 'dog' ? 'Dogs' : 'Cats'}`}</button>)}</div>
        <div className="segmented">{(['all', 'small', 'medium', 'large'] as const).map((s) => <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>{s === 'all' ? 'Any size' : s[0].toUpperCase() + s.slice(1)}</button>)}</div>
      </div>
      <div className="grid-auto" style={{ marginTop: 16 }}>
        {list.map((a) => (
          <article key={a.id} className="adopt card">
            <button className="adopt-img" onClick={() => setOpen(a.id)}><img src={a.photo.src} alt={a.name} loading="lazy" />{a.daysWaiting > 60 && <span className="adopt-wait">Waiting {a.daysWaiting} days</span>}</button>
            <button className={`adopt-fav ${a.favorite ? 'on' : ''}`} onClick={() => favoriteAdopt(a.id)} aria-label="Favourite"><Heart size={18} fill={a.favorite ? 'currentColor' : 'none'} /></button>
            <div className="card-pad" style={{ paddingTop: 14 }}>
              <div className="between"><h3 className="h3">{a.name}</h3><span className="tiny muted">{a.distanceKm} km</span></div>
              <p className="small muted">{a.breed} · {a.ageLabel} · {a.sex === 'girl' ? '♀' : '♂'}</p>
              <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>{a.traits.map((t) => <span key={t} className="pill mint">{t}</span>)}</div>
              <button className="btn btn-soft btn-block btn-sm" style={{ marginTop: 14 }} onClick={() => setOpen(a.id)}>{a.applied ? <><Check size={14} /> Request sent</> : `Meet ${a.name}`}</button>
            </div>
          </article>
        ))}
      </div>
      {sel && (
        <Modal onClose={() => setOpen(null)} size="mid" label={sel.name}>
          <ModalHead title={`Meet ${sel.name}`} onClose={() => setOpen(null)} />
          <div className="modal-body adopt-detail">
            <img src={sel.photo.src} alt="" />
            <div className="col" style={{ gap: 10 }}>
              <p className="small muted">{sel.breed} · {sel.ageLabel} · {sel.size} · at <b className="ink">{sel.shelter}</b></p>
              <p>{sel.story}</p>
              <p className="small"><b>Good with:</b> {sel.goodWith.join(', ')}</p>
              {sel.applied ? <div className="earned"><Check size={22} /><div><b>Request sent</b><p className="tiny muted">{sel.shelter} will reply within 48 hours.</p></div></div> : (
                <form className="col" style={{ gap: 10 }} onSubmit={(e) => { e.preventDefault(); applyAdopt(sel.id); }}>
                  <label className="field"><span>Your home</span><select className="select" value={form.home} onChange={(e) => setForm({ ...form, home: e.target.value })}>{['House with garden', 'Apartment', 'Townhouse', 'Farm / rural'].map((x) => <option key={x}>{x}</option>)}</select></label>
                  <label className="field"><span>Other pets at home</span><input className="input" value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} placeholder={db.owners[db.meId].petIds.map((id) => db.pets[id].name).join(', ')} /></label>
                  <label className="field"><span>A note for the shelter</span><textarea className="textarea" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={`Why you and ${sel.name} would be a great match`} /></label>
                  <button className="btn btn-primary btn-block">Request a meet-and-greet</button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =================================================================== Lost & found
function ReportLost({ onClose }: { onClose(): void }) {
  const db = useDb();
  const { reportLost } = useActions();
  const [f, setF] = useState({ petId: db.owners[db.meId].petIds[0], name: '', where: 'Larkspur Dog Park', description: '', reward: 0, contact: '(555) 014-0000' });
  const [photo, setPhoto] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const pet = db.pets[f.petId];
  const place = db.places.find((p) => p.name === f.where) ?? db.places[0];
  return (
    <Modal onClose={onClose} label="Report a lost pet">
      <ModalHead title="Report a lost pet" onClose={onClose} />
      <form className="modal-body col" style={{ gap: 14 }} onSubmit={(e) => {
        e.preventDefault();
        const alert: LostAlert = { id: uid('l'), petName: f.petId === 'other' ? f.name : pet.name, species: f.petId === 'other' ? 'dog' : pet.species, breed: f.petId === 'other' ? 'Unknown' : pet.breed,
          photo: photo ? { src: photo, thumb: photo } : { src: pet?.avatar ?? '', thumb: pet?.avatar }, lastSeen: f.where, x: place.x + 10, y: place.y + 10, createdAt: new Date().toISOString(),
          status: 'lost', reporterOwnerId: db.meId, description: f.description || 'Please call if seen.', reward: f.reward || undefined, sightings: 0, contact: f.contact };
        reportLost(alert); onClose();
      }}>
        <div className="warn"><AlertTriangle size={18} /> Alerts go to everyone within 2 km. Also call your microchip registry and local shelters.</div>
        <label className="field"><span>Which pet?</span><select className="select" value={f.petId} onChange={(e) => setF({ ...f, petId: e.target.value })}>{db.owners[db.meId].petIds.map((id) => <option key={id} value={id}>{db.pets[id].name}</option>)}<option value="other">Someone else’s pet / found a pet</option></select></label>
        {f.petId === 'other' && <label className="field"><span>Name (if known)</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>}
        <label className="field"><span>Last seen near</span><select className="select" value={f.where} onChange={(e) => setF({ ...f, where: e.target.value })}>{db.places.map((p) => <option key={p.id}>{p.name}</option>)}</select></label>
        <label className="field"><span>Description</span><textarea className="textarea" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Collar colour, markings, temperament, does it come when called?" /></label>
        <div className="row wrap" style={{ gap: 12 }}>
          <label className="field grow"><span>Reward ($, optional)</span><input type="number" className="input" min={0} value={f.reward} onChange={(e) => setF({ ...f, reward: +e.target.value })} /></label>
          <label className="field grow"><span>Contact number</span><input className="input" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></label>
        </div>
        <div className="row">{photo && <img src={photo} alt="" className="edit-av" />}<button type="button" className="btn btn-soft btn-sm" onClick={() => file.current?.click()}><Camera size={15} /> Recent photo</button></div>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) setPhoto(await downscaleImage(x, 700)); }} />
        <button className="btn btn-primary btn-block"><Siren size={16} /> Send alert to neighbours</button>
      </form>
    </Modal>
  );
}

export function LostPage() {
  const db = useDb();
  const { sighting, resolveLost } = useActions();
  const [reporting, setReporting] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const active = db.lost.filter((l) => l.status === 'lost');
  const found = db.lost.filter((l) => l.status === 'found');
  const markers = useMemo(() => active.map((l) => ({ id: l.id, x: l.x, y: l.y, color: '#b3261e', icon: <Siren size={15} />, label: l.petName, photo: l.photo.thumb, pulse: true, active: sel === l.id, onClick: () => setSel(l.id) })), [active, sel]);
  const focus = db.lost.find((l) => l.id === sel);
  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="h1">Lost & found</h1><p>A neighbourhood safety net. Alerts reach everyone within 2 km in seconds.</p></div>
        <button className="btn btn-primary" onClick={() => setReporting(true)}><Siren size={16} /> Report lost or found pet</button>
      </div>
      <div className="lost-layout">
        <div className="card" style={{ overflow: 'hidden' }}><NeighbourhoodMap height={420} markers={markers} focus={focus ? [focus.x, focus.y] : undefined} /></div>
        <div className="col" style={{ gap: 14 }}>
          {active.length === 0 && <Empty icon={<House size={24} strokeWidth={1.75} />} title="No active alerts nearby" />}
          {active.map((l) => (
            <article key={l.id} className={`lost card ${sel === l.id ? 'on' : ''}`} onClick={() => setSel(l.id)}>
              <img src={l.photo.src} alt={l.petName} />
              <div className="grow col" style={{ gap: 6 }}>
                <div className="between"><span className="pill coral"><Siren size={12} /> LOST · {timeAgo(l.createdAt)}</span>{l.reward && <span className="pill honey">${l.reward} reward</span>}</div>
                <h3 className="h2">{l.petName}</h3>
                <p className="small muted">{l.breed}</p>
                <p className="small row" style={{ gap: 6 }}><MapPin size={14} /> {l.lastSeen}</p>
                <p className="small">{l.description}</p>
                <div className="row wrap" style={{ gap: 8 }}>
                  {l.reporterOwnerId === db.meId
                    ? <button className="btn btn-mint btn-sm" onClick={() => resolveLost(l.id)}><Check size={14} /> Mark as found</button>
                    : <button className={`btn btn-sm ${l.sightedByMe ? 'btn-soft' : 'btn-dark'}`} onClick={(e) => { e.stopPropagation(); sighting(l.id); }} disabled={l.sightedByMe}><Eye size={14} /> {l.sightedByMe ? 'Sighting shared' : 'I’ve seen them'}</button>}
                  <span className="btn btn-ghost btn-sm"><Phone size={14} /> {l.contact}</span>
                  <span className="tiny muted">{l.sightings} sightings</span>
                </div>
              </div>
            </article>
          ))}
          <h3 className="h3" style={{ marginTop: 10 }}>Reunited</h3>
          <div className="hscroll">{found.map((l) => <div key={l.id} className="reunited"><img src={l.photo.thumb} alt="" /><b className="small">{l.petName}</b><span className="tiny muted">{l.sightings} neighbours helped</span></div>)}</div>
        </div>
      </div>
      {reporting && <ReportLost onClose={() => setReporting(false)} />}
    </div>
  );
}
