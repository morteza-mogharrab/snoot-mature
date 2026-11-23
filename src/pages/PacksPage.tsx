import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, PawPrint, Plus, ShieldCheck } from 'lucide-react';
import { useActions, useDb, useUI } from '../store/AppStore';
import { compact } from '../utils/format';
import { PostCard } from '../components/feed/PostCard';
import { EventCard } from './EventsPage';
import { Empty } from '../components/ui/Kit';

export function PacksPage() {
  const db = useDb();
  const { joinPack } = useActions();
  const mine = db.packs.filter((p) => p.joined);
  return (
    <div className="page">
      <div className="page-head"><div><h1 className="h1">Packs</h1><p>Communities for breeds, interests and neighbourhood walking groups.</p></div></div>
      {mine.length > 0 && (
        <>
          <h2 className="h3">Your packs</h2>
          <div className="hscroll" style={{ margin: '12px 0 28px' }}>
            {mine.map((p) => (
              <Link key={p.id} to={`/packs/${p.id}`} className="pack-mini" style={{ ['--pk' as string]: p.color }}>
                <span className="pack-mini-ico">{p.icon}</span><b>{p.name}</b><span className="tiny muted">{compact(p.members)} members</span>
              </Link>
            ))}
          </div>
        </>
      )}
      <h2 className="h3">Find your pack</h2>
      <div className="grid-auto" style={{ marginTop: 12 }}>
        {db.packs.map((p) => (
          <article key={p.id} className="pack card">
            <Link to={`/packs/${p.id}`} className="pack-cover"><img src={p.cover.src} alt="" loading="lazy" /><span className="pack-ico" style={{ background: p.color }}>{p.icon}</span></Link>
            <div className="card-pad" style={{ paddingTop: 30 }}>
              <Link to={`/packs/${p.id}`} className="h3">{p.name}</Link>
              <p className="small muted">{p.tagline}</p>
              <div className="between" style={{ marginTop: 14 }}>
                <span className="avatars-stack">{p.memberPetIds.slice(0, 4).map((id) => db.pets[id] && <img key={id} src={db.pets[id].avatar} alt="" />)}<span className="tiny muted" style={{ marginLeft: 8 }}>{compact(p.members)}</span></span>
                <button className={`btn btn-sm ${p.joined ? 'btn-soft' : 'btn-dark'}`} onClick={() => joinPack(p.id)}>{p.joined ? <><Check size={14} /> Joined</> : <><Plus size={14} /> Join</>}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function PackDetailPage() {
  const { id } = useParams();
  const db = useDb();
  const { joinPack } = useActions();
  const { openComposer } = useUI();
  const p = db.packs.find((x) => x.id === id);
  if (!p) return <div className="page"><Empty icon={<PawPrint size={24} strokeWidth={1.75} />} title="Pack not found" /></div>;
  const posts = Object.values(db.posts).filter((x) => x.packId === p.id || p.memberPetIds.includes(x.petId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const events = db.events.filter((e) => e.packId === p.id);
  return (
    <div>
      <div className="pack-hero" style={{ ['--pk' as string]: p.color }}>
        <img src={p.cover.src} alt="" />
        <div className="pack-hero-inner page" style={{ paddingBottom: 26 }}>
          <Link to="/packs" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}><ArrowLeft size={15} /> Packs</Link>
          <div className="row" style={{ gap: 16, marginTop: 'auto', alignItems: 'flex-end' }}>
            <span className="pack-ico big" style={{ background: p.color }}>{p.icon}</span>
            <div className="grow"><h1 className="h1" style={{ color: '#fff' }}>{p.name}</h1><p style={{ color: 'rgba(255,255,255,.85)' }}>{p.tagline} · {compact(p.members)} members</p></div>
            <button className={`btn ${p.joined ? 'btn-soft' : 'btn-primary'}`} onClick={() => joinPack(p.id)}>{p.joined ? 'Joined ✓' : 'Join pack'}</button>
          </div>
        </div>
      </div>
      <div className="page pack-layout">
        <div className="col" style={{ gap: 18 }}>
          {p.joined && <button className="card card-pad row compose-cta" onClick={() => openComposer()}><Plus size={18} /> Share something with {p.name}…</button>}
          {posts.map((x) => <PostCard key={x.id} post={x} />)}
        </div>
        <aside className="col" style={{ gap: 16 }}>
          <section className="card card-pad"><h3 className="h3">About</h3><p className="small muted" style={{ marginTop: 6 }}>{p.description}</p>
            <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>{p.tags.map((t) => <span key={t} className="pill">{t}</span>)}</div></section>
          <section className="card card-pad"><h3 className="h3 row" style={{ gap: 6 }}><ShieldCheck size={18} /> Pack rules</h3><ol className="rules">{p.rules.map((r) => <li key={r}>{r}</li>)}</ol></section>
          {events.length > 0 && <section><h3 className="h3" style={{ marginBottom: 10 }}>Upcoming</h3><div className="col">{events.map((e) => <EventCard key={e.id} e={e} />)}</div></section>}
          <section className="card card-pad"><h3 className="h3">Members</h3>
            <div className="member-grid">{p.memberPetIds.map((id) => db.pets[id] && <Link key={id} to={`/pet/${db.pets[id].handle}`} title={db.pets[id].name}><img src={db.pets[id].avatar} alt={db.pets[id].name} /></Link>)}</div></section>
        </aside>
      </div>
    </div>
  );
}
