import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Hash, HeartHandshake, House, MapPin, PawPrint, Search, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import type { Species } from '../types';
import { useActions, useActivePet, useDb, useUI } from '../store/AppStore';
import { pawMatches, searchAll, trendingTags } from '../store/selectors';
import { PLACE_META } from '../data/meta';
import { compact, fmtDay } from '../utils/format';
import { PostGrid } from '../components/feed/PostGrid';
import { Empty } from '../components/ui/Kit';

const SPECIES: (Species | 'all')[] = ['all', 'dog', 'cat', 'bird', 'small', 'fish'];

function Matches() {
  const db = useDb();
  const pet = useActivePet();
  const navigate = useNavigate();
  const { openConversation, sendMessage, follow } = useActions();
  const { toast } = useUI();
  const matches = pawMatches(db, pet.id, 12);
  return (
    <div className="match-grid">
      {matches.map((m) => (
        <article key={m.pet.id} className="match card">
          <div className="match-photos">
            <img src={pet.avatar} alt="" /><span className="match-heart"><HeartHandshake size={18} /></span><img src={m.pet.avatar} alt="" />
          </div>
          <div className="match-score-big">{m.score}<small>%</small></div>
          <Link to={`/pet/${m.pet.handle}`} className="h3" style={{ textAlign: 'center' }}>{m.pet.name}</Link>
          <p className="tiny muted" style={{ textAlign: 'center' }}>{m.pet.breed} · {m.pet.neighbourhood}</p>
          <div className="row wrap" style={{ justifyContent: 'center', gap: 6 }}>{m.reasons.map((r) => <span key={r} className="pill mint">{r}</span>)}</div>
          <div className="row" style={{ marginTop: 'auto' }}>
            <button className="btn btn-soft btn-sm grow" onClick={() => follow(m.pet.id)}>{db.followingPetIds.includes(m.pet.id) ? 'Following' : 'Follow'}</button>
            <button className="btn btn-primary btn-sm grow" onClick={() => {
              const id = openConversation(m.pet.id);
              sendMessage(id, `Hi ${m.pet.name}! We’re a ${m.score}% PawMatch. Fancy a playdate?`);
              toast(`Playdate request sent to ${m.pet.name}`);
              navigate(`/messages/${id}`);
            }}>Playdate</button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DiscoverPage() {
  const db = useDb();
  const pet = useActivePet();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const tab = sp.get('tab') ?? 'explore';
  const [species, setSpecies] = useState<Species | 'all'>('all');
  const res = useMemo(() => searchAll(db, q), [db, q]);
  const tags = trendingTags(db);
  const grid = useMemo(() => {
    const tag = q.startsWith('#') ? q.slice(1).toLowerCase() : '';
    return Object.values(db.posts)
      .filter((p) => species === 'all' || db.pets[p.petId]?.species === species)
      .filter((p) => !tag || p.caption.toLowerCase().includes(`#${tag}`))
      .sort((a, b) => b.boops - a.boops);
  }, [db, species, q]);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const hasResults = q && !q.startsWith('#');

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="h1">Discover</h1><p>Pets, places, packs and playdates picked for {pet.name}.</p></div>
        <div className="segmented">
          <button className={tab === 'explore' ? 'on' : ''} onClick={() => set('tab', '')}>Explore</button>
          <button className={tab === 'match' ? 'on' : ''} onClick={() => set('tab', 'match')}><HeartHandshake size={14} /> PawMatch</button>
        </div>
      </div>
      <form className="search big-search" onSubmit={(e) => e.preventDefault()} role="search">
        <Search size={20} className="faint" />
        <input value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search pets, breeds, places, events, #hashtags…" aria-label="Search" />
        {q && <button type="button" className="icon-btn sm" onClick={() => set('q', '')} aria-label="Clear"><X size={18} /></button>}
      </form>

      {tab === 'match' ? (
        <div className="section">
          <div className="match-hero card">
            <div><p className="eyebrow"><Sparkles size={12} /> PawMatch</p><h2 className="h2">Find {pet.name}’s next best friend</h2><p className="muted small">Matches use energy, sociability, mischief and neighbourhood to suggest pets who’d actually enjoy a playdate together.</p></div>
          </div>
          <div style={{ marginTop: 18 }}><Matches /></div>
        </div>
      ) : hasResults ? (
        <div className="section col" style={{ gap: 28 }}>
          {res.pets.length > 0 && <div><h3 className="h3" style={{ marginBottom: 12 }}>Pets</h3><div className="hscroll">{res.pets.map((p) => (
            <Link key={p.id} to={`/pet/${p.handle}`} className="pet-tile card"><img src={p.avatar} alt="" /><b>{p.name}</b><span className="tiny muted">{p.breed}</span></Link>
          ))}</div></div>}
          {res.places.length > 0 && <div><h3 className="h3" style={{ marginBottom: 12 }}>Places</h3><div className="col">{res.places.map((p) => (
            <Link key={p.id} to={`/map?place=${p.id}`} className="list-row card"><span className="list-ico" style={{ background: PLACE_META[p.category].color }}>{PLACE_META[p.category].icon}</span><span className="grow"><b>{p.name}</b><span className="tiny muted" style={{ display: 'block' }}>{PLACE_META[p.category].label} · ★ {p.rating}</span></span><ArrowRight size={18} /></Link>
          ))}</div></div>}
          {res.events.length > 0 && <div><h3 className="h3" style={{ marginBottom: 12 }}>Events</h3><div className="col">{res.events.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="list-row card"><img src={e.cover.thumb} alt="" className="list-img" /><span className="grow"><b>{e.title}</b><span className="tiny muted" style={{ display: 'block' }}>{fmtDay(e.start)}</span></span><ArrowRight size={18} /></Link>
          ))}</div></div>}
          {res.packs.length > 0 && <div><h3 className="h3" style={{ marginBottom: 12 }}>Packs</h3><div className="col">{res.packs.map((p) => (
            <Link key={p.id} to={`/packs/${p.id}`} className="list-row card"><span className="list-ico" style={{ background: p.color }}>{p.icon}</span><span className="grow"><b>{p.name}</b><span className="tiny muted" style={{ display: 'block' }}>{compact(p.members)} members</span></span><ArrowRight size={18} /></Link>
          ))}</div></div>}
          {res.tags.length > 0 && <div className="row wrap">{res.tags.map((t) => <button key={t} className="chip" onClick={() => set('q', `#${t}`)}><Hash size={13} />{t}</button>)}</div>}
          {!res.pets.length && !res.places.length && !res.events.length && !res.packs.length && !res.tags.length && <Empty icon={<Search size={24} strokeWidth={1.75} />} title={`No results for “${q}”`}><p>Try a breed (“shiba”), a place (“beach”) or a hashtag.</p></Empty>}
        </div>
      ) : (
        <>
          <div className="section">
            <div className="section-head"><h2 className="h3 row" style={{ gap: 8 }}><TrendingUp size={18} /> Trending in Maplewood</h2></div>
            <div className="chips">{tags.map((t) => <button key={t.tag} className={`chip ${q === `#${t.tag}` ? 'on' : ''}`} onClick={() => set('q', q === `#${t.tag}` ? '' : `#${t.tag}`)}>#{t.tag} <span className="faint">{compact(t.posts)}</span></button>)}</div>
          </div>
          <div className="discover-mods">
            <Link to="?tab=match" className="dmod dmod-match">
              <span className="dmod-art">{pawMatches(db, pet.id, 3).map((m) => <img key={m.pet.id} src={m.pet.avatar} alt="" />)}</span>
              <b className="h3">PawMatch</b><span className="small">Playdate picks for {pet.name}</span>
            </Link>
            <Link to="/map" className="dmod dmod-map"><MapPin size={26} /><b className="h3">{db.places.length} places nearby</b><span className="small">Parks, vets, cafés & more</span></Link>
            <Link to="/adopt" className="dmod dmod-adopt"><House size={22} strokeWidth={1.75} /><b className="h3">{db.adoption.length} waiting for homes</b><span className="small">Adoptable pets near you</span></Link>
            <Link to="/packs" className="dmod dmod-packs"><Users size={22} strokeWidth={1.75} /><b className="h3">Join a pack</b><span className="small">Breed clubs & walking groups</span></Link>
          </div>
          <div className="section">
            <div className="section-head">
              <h2 className="h3">{q.startsWith('#') ? q : 'Popular right now'}</h2>
              <div className="chips">{SPECIES.map((s) => <button key={s} className={`chip ${species === s ? 'on' : ''}`} onClick={() => setSpecies(s)}>{s === 'all' ? 'All' : `${s === 'small' ? 'Small pets' : s[0].toUpperCase() + s.slice(1) + 's'}`}</button>)}</div>
            </div>
            {grid.length ? <PostGrid posts={grid} /> : <Empty icon={<PawPrint size={24} strokeWidth={1.75} />} title="Nothing here yet" />}
          </div>
        </>
      )}
    </div>
  );
}
