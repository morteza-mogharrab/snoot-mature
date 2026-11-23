import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BadgeCheck, BookHeart, BookOpen, Cake, Camera, Clapperboard, Edit3, EyeOff, Grid3x3, Images, MapPin, MessageCircle, MessageCircleHeart, NotebookPen, PartyPopper, Plus, RefreshCw, Share2, Sparkles, Trophy, Users } from 'lucide-react';
import type { MemoryType, Mood, Pet } from '../types';
import { useActions, useDb, useUI } from '../store/AppStore';
import { isMine, postsByPet, walksFor, walkTotals } from '../store/selectors';
import { ai } from '../services/ai';
import { MOODS } from '../data/meta';
import { ageLabel, compact, daysUntilBirthday, downscaleImage, fmtDate, levelFromXp, timeShort } from '../utils/format';
import { BoopIcon } from '../components/ui/Brand';
import { Empty, Modal, ModalHead } from '../components/ui/Kit';
import { PetCard } from '../components/profile/PetCard';
import { PostGrid } from '../components/feed/PostGrid';

type Tab = 'posts' | 'clips' | 'memories' | 'diary' | 'albums' | 'badges' | 'card';

function EditPet({ pet, onClose }: { pet: Pet; onClose(): void }) {
  const { updatePet } = useActions();
  const [form, setForm] = useState({ name: pet.name, bio: pet.bio, breed: pet.breed, favorites: pet.favorites.join(', ') });
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(pet.avatar);
  return (
    <Modal onClose={onClose} label="Edit profile">
      <ModalHead title={`Edit ${pet.name}`} onClose={onClose} />
      <form className="modal-body col" style={{ gap: 14 }} onSubmit={(e) => { e.preventDefault(); updatePet(pet.id, { ...form, avatar, favorites: form.favorites.split(',').map((s) => s.trim()).filter(Boolean) }); onClose(); }}>
        <div className="row">
          <img src={avatar} alt="" className="edit-av" />
          <button type="button" className="btn btn-soft btn-sm" onClick={() => file.current?.click()}><Camera size={15} /> Change photo</button>
          <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAvatar(await downscaleImage(f, 400)); }} />
        </div>
        <label className="field"><span>Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field"><span>Breed</span><input className="input" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></label>
        <label className="field">
          <span className="between">Bio <button type="button" className="link tiny" onClick={async () => { setBusy(true); setForm({ ...form, bio: await ai.improve({ pet, text: form.bio }) }); setBusy(false); }}><Sparkles size={12} /> {busy ? 'Polishing…' : 'Polish with AI'}</button></span>
          <textarea className="textarea" value={form.bio} maxLength={160} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <label className="field"><span>Favourite things (comma separated)</span><input className="input" value={form.favorites} onChange={(e) => setForm({ ...form, favorites: e.target.value })} /></label>
        <button className="btn btn-primary btn-block">Save</button>
      </form>
    </Modal>
  );
}

function AddMemory({ pet, onClose }: { pet: Pet; onClose(): void }) {
  const { addMemory } = useActions();
  const [type, setType] = useState<MemoryType>('first');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [img, setImg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const EMOJI: Record<MemoryType, string> = { milestone: '🏆', first: '✨', adventure: '🗺️', health: '💉', photo: '📸', birthday: '🎂' };
  return (
    <Modal onClose={onClose} label="Add memory">
      <ModalHead title="Add a memory" onClose={onClose} />
      <form className="modal-body col" style={{ gap: 14 }} onSubmit={(e) => { e.preventDefault(); addMemory({ petId: pet.id, type, title, note, date: new Date(date).toISOString(), emoji: EMOJI[type], media: img ? { src: img, thumb: img } : undefined }); onClose(); }}>
        <div className="chips">{(Object.keys(EMOJI) as MemoryType[]).map((t) => <button type="button" key={t} className={`chip ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
        <label className="field"><span>Title</span><input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="First snow day" /></label>
        <label className="field"><span>Date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field"><span>The story</span><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? Future you will love the details." /></label>
        <div className="row">{img && <img src={img} alt="" className="edit-av" style={{ borderRadius: 14 }} />}<button type="button" className="btn btn-soft btn-sm" onClick={() => file.current?.click()}><Camera size={15} /> {img ? 'Change photo' : 'Add a photo'}</button></div>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await downscaleImage(f, 900)); }} />
        <button className="btn btn-primary btn-block" disabled={!title.trim()}>Save to scrapbook</button>
      </form>
    </Modal>
  );
}

function Memories({ pet, mine }: { pet: Pet; mine: boolean }) {
  const db = useDb();
  const { celebrateBirthday, earn } = useActions();
  const { openComposer, toast } = useUI();
  const [adding, setAdding] = useState(false);
  const list = db.memories.filter((m) => m.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  const b = daysUntilBirthday(pet.birthday);
  const onThisDay = list.find((m) => { const d = new Date(m.date); const n = new Date(); return d.getMonth() === n.getMonth() && Math.abs(d.getDate() - n.getDate()) <= 10 && d.getFullYear() < n.getFullYear(); }) ?? list[list.length - 1];
  return (
    <div className="mem">
      <div className="mem-top">
        <div className="bday-card">
          <span className="bday-big"><Cake size={26} strokeWidth={1.5} /></span>
          <div className="grow">
            <p className="eyebrow">Birthday</p>
            <p className="h2">{b.days === 0 ? `Happy birthday, ${pet.name}!` : `${b.days} days until ${pet.name} turns ${b.turning}`}</p>
            <p className="small muted">{fmtDate(pet.birthday, { month: 'long', day: 'numeric' })}{pet.gotchaDay ? ` · Gotcha day ${fmtDate(pet.gotchaDay, { month: 'long', day: 'numeric' })}` : ''}</p>
          </div>
          {mine && <div className="col" style={{ gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { celebrateBirthday(pet.id); toast(`Birthday mode on for ${pet.name}`); }}><PartyPopper size={15} /> Celebrate</button>
            <button className="btn btn-soft btn-sm" onClick={async () => {
              const [c] = await ai.captions({ pet, tone: 'wholesome', context: `Counting down to my birthday — ${b.days} sleeps to go` });
              openComposer({ caption: c, media: [{ src: pet.avatar, thumb: pet.avatar }] }); earn(0, '', true);
            }}><Sparkles size={14} /> AI birthday post</button>
          </div>}
        </div>
        {onThisDay && (
          <div className="otd">
            {onThisDay.media && <img src={onThisDay.media.thumb ?? onThisDay.media.src} alt="" />}
            <div><p className="eyebrow">On this day · {fmtDate(onThisDay.date, { year: 'numeric' })}</p><p className="bold">{onThisDay.emoji} {onThisDay.title}</p><p className="tiny muted clamp2">{onThisDay.note}</p></div>
          </div>
        )}
      </div>
      <div className="between" style={{ margin: '24px 0 12px' }}>
        <h3 className="h3">{pet.name}’s scrapbook</h3>
        {mine && <button className="btn btn-dark btn-sm" onClick={() => setAdding(true)}><Plus size={15} /> Add memory</button>}
      </div>
      {list.length === 0 ? <Empty icon={<BookOpen size={24} strokeWidth={1.75} />} title="No memories yet">{mine && <p>Capture firsts, adventures and milestones.</p>}</Empty> : (
        <ol className="timeline">
          {list.map((m) => (
            <li key={m.id} className={`tl-item t-${m.type}`}>
              <span className="tl-dot">{m.emoji}</span>
              <div className="tl-card">
                <div className="between"><b>{m.title}</b><span className="tiny faint nowrap">{fmtDate(m.date)}</span></div>
                <p className="small muted" style={{ marginTop: 4 }}>{m.note}</p>
                {m.media && <img src={m.media.src} alt="" className="tl-img" loading="lazy" />}
              </div>
            </li>
          ))}
        </ol>
      )}
      {adding && <AddMemory pet={pet} onClose={() => setAdding(false)} />}
    </div>
  );
}

function Diary({ pet, mine }: { pet: Pet; mine: boolean }) {
  const db = useDb();
  const { addDiary } = useActions();
  const [mood, setMood] = useState<Mood>('happy');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [ai_, setAi] = useState(false);
  const entries = db.diary.filter((d) => d.petId === pet.id).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="diary">
      {mine && (
        <div className="card card-pad diary-new">
          <div className="between"><h3 className="h3">Today in {pet.name}’s words</h3><span className="tiny faint">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span></div>
          <div className="chips" style={{ margin: '12px 0' }}>{MOODS.map((m) => <button key={m.id} className={`chip ${mood === m.id ? 'on' : ''}`} onClick={() => setMood(m.id)}>{m.emoji} {m.label}</button>)}</div>
          <textarea className="textarea" value={text} onChange={(e) => { setText(e.target.value); setAi(false); }} placeholder="Jot what happened (e.g. “met a cat, ate a sock”) — or let AI write it in their voice" />
          <div className="row wrap" style={{ marginTop: 10 }}>
            <button className="btn btn-soft btn-sm" disabled={busy} onClick={async () => { setBusy(true); setText(await ai.diary({ pet, mood, events: text })); setAi(true); setBusy(false); }}>
              {busy ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />} Write it as {pet.name}
            </button>
            <button className="btn btn-dark btn-sm" disabled={!text.trim()} onClick={() => { addDiary(pet.id, mood, text, ai_); setText(''); }}>Save entry</button>
          </div>
        </div>
      )}
      <div className="col" style={{ gap: 12, marginTop: 16 }}>
        {entries.map((d) => (
          <article key={d.id} className="diary-entry">
            <span className="diary-mood">{MOODS.find((m) => m.id === d.mood)?.emoji}</span>
            <div className="grow">
              <div className="between"><span className="tiny bold muted">{fmtDate(d.date, { weekday: 'long', month: 'short', day: 'numeric' })}</span>{d.aiWritten && <span className="pill lilac"><Sparkles size={11} /> AI</span>}</div>
              <p className="diary-text">{d.text}</p>
            </div>
          </article>
        ))}
        {!entries.length && <Empty icon={<NotebookPen size={24} strokeWidth={1.75} />} title="No diary entries yet" />}
      </div>
    </div>
  );
}

function Albums({ pet }: { pet: Pet }) {
  const db = useDb();
  const { addToAlbum } = useActions();
  const file = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState('');
  const albums = db.albums.filter((a) => a.petIds.includes(pet.id));
  if (!albums.length) return <Empty icon={<Images size={24} strokeWidth={1.75} />} title="No shared albums yet"><p>Albums are shared with friends — everyone can add photos.</p></Empty>;
  return (
    <div className="grid-auto">
      {albums.map((a) => (
        <div key={a.id} className="album card">
          <div className="album-mosaic">{a.media.slice(0, 4).map((m, i) => <img key={i} src={m.thumb ?? m.src} alt="" loading="lazy" />)}</div>
          <div className="card-pad" style={{ paddingTop: 12 }}>
            <b>{a.title}</b>
            <div className="between" style={{ marginTop: 8 }}>
              <span className="avatars-stack">{a.contributorIds.map((o) => <img key={o} src={db.owners[o].avatar} alt={db.owners[o].name} title={db.owners[o].name} />)}<span className="tiny muted" style={{ marginLeft: 8 }}>{a.media.length} photos</span></span>
              <button className="btn btn-soft btn-sm" onClick={() => { setTarget(a.id); file.current?.click(); }}><Plus size={14} /> Add</button>
            </div>
          </div>
        </div>
      ))}
      <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f && target) addToAlbum(target, await downscaleImage(f, 900)); }} />
    </div>
  );
}

function Badges({ pet }: { pet: Pet }) {
  const db = useDb();
  return (
    <div className="badges">
      {db.badges.map((b) => {
        const has = pet.badgeIds.includes(b.id);
        return (
          <div key={b.id} className={`badge-tile ${has ? 'has' : ''} tier-${b.tier}`} style={{ ['--b' as string]: b.color }}>
            <span className="badge-medal">{b.icon}</span>
            <b className="small">{b.name}</b>
            <span className="tiny muted">{b.description}</span>
            <span className={`pill ${has ? 'mint' : ''}`}>{has ? 'Earned' : 'Locked'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PetProfilePage() {
  const { handle } = useParams();
  const db = useDb();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { follow, openConversation, setActivePet } = useActions();
  const { openPetChat, openComposer, toast } = useUI();
  const [edit, setEdit] = useState(false);
  const [flip, setFlip] = useState(false);
  const pet = Object.values(db.pets).find((p) => p.handle === handle);
  const posts = useMemo(() => (pet ? postsByPet(db, pet.id) : []), [db, pet]);
  if (!pet) return <div className="page"><Empty icon={<EyeOff size={24} strokeWidth={1.75} />} title="This pet is hiding"><Link to="/" className="btn btn-primary">Back home</Link></Empty></div>;

  const mine = isMine(db, pet.id);
  const owner = db.owners[pet.ownerId];
  const tab = (sp.get('tab') as Tab) || 'posts';
  const setTab = (t: Tab) => setSp(t === 'posts' ? {} : { tab: t }, { replace: true });
  const lvl = levelFromXp(pet.xp);
  const totals = walkTotals(walksFor(db, pet.id));
  const boops = posts.reduce((s, p) => s + p.boops, 0);
  const following = db.followingPetIds.includes(pet.id);
  const packs = db.packs.filter((p) => p.memberPetIds.includes(pet.id));
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'posts', label: 'Posts', icon: <Grid3x3 size={16} /> }, { id: 'clips', label: 'Clips', icon: <Clapperboard size={16} /> },
    { id: 'memories', label: 'Memories', icon: <BookHeart size={16} /> }, { id: 'diary', label: 'Diary', icon: <NotebookPen size={16} /> },
    { id: 'albums', label: 'Albums', icon: <Images size={16} /> }, { id: 'badges', label: 'Badges', icon: <Trophy size={16} /> },
    { id: 'card', label: 'Pet Card', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="profile">
      <div className="cover" style={{ backgroundImage: `url(${pet.cover})` }}><div className="cover-fade" /></div>
      <div className="page" style={{ paddingTop: 0 }}>
        <header className="ph">
          <div className="ph-av">
            <img src={pet.avatar} alt={pet.name} />
            <span className="ph-lvl" title={`${lvl.into}/${lvl.need} XP to next level`}>LV {lvl.level}</span>
          </div>
          <div className="ph-main">
            <div className="row wrap" style={{ gap: 10 }}>
              <h1 className="h1">{pet.name}</h1>
              {pet.verified && <BadgeCheck size={24} className="verified" fill="currentColor" stroke="var(--surface)" />}
              <span className="pill">{pet.breed}</span>
              <span className="pill">{pet.sex === 'girl' ? '♀' : '♂'} {ageLabel(pet.birthday)}</span>
              <span className="pill"><MapPin size={12} /> {pet.neighbourhood}</span>
            </div>
            <p className="ph-arch"><Sparkles size={14} /> {pet.personality.archetype}</p>
            <p className="ph-bio">{pet.bio}</p>
            <div className="row wrap" style={{ gap: 6 }}>{pet.traits.map((t) => <span key={t} className="pill">{t}</span>)}</div>
            <Link to={mine ? '/me' : '#'} className="owner-line"><img src={owner.avatar} alt="" /> <span className="small">Human: <b>{owner.name}</b></span></Link>
          </div>
          <div className="ph-actions">
            {mine ? (
              <>
                <button className="btn btn-primary" onClick={() => openComposer()}><Plus size={16} /> Post as {pet.name}</button>
                <button className="btn btn-soft" onClick={() => setEdit(true)}><Edit3 size={16} /> Edit</button>
                {db.activePetId !== pet.id && <button className="btn btn-soft" onClick={() => setActivePet(pet.id)}>Act as {pet.name}</button>}
              </>
            ) : (
              <>
                <button className={`btn ${following ? 'btn-soft' : 'btn-primary'}`} onClick={() => follow(pet.id)}>{following ? 'Following' : 'Follow'}</button>
                <button className="btn btn-soft" onClick={() => navigate(`/messages/${openConversation(pet.id)}`)}><MessageCircle size={16} /> Message</button>
              </>
            )}
            <button className="btn btn-soft" onClick={() => openPetChat(pet.id)}><MessageCircleHeart size={16} /> Talk to {pet.name.split(' ')[0]}</button>
            <button className="icon-btn" aria-label="Share profile" onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/pet/${pet.handle}`); toast('Profile link copied'); } catch { toast('Couldn’t copy'); } }}><Share2 size={18} /></button>
          </div>
        </header>

        <div className="ph-stats">
          <div><b>{compact(pet.followers)}</b><span>followers</span></div>
          <div><b>{compact(pet.following)}</b><span>following</span></div>
          <div><b>{compact(boops)}</b><span className="row" style={{ gap: 4 }}><BoopIcon size={13} /> boops</span></div>
          <div><b>{totals.km.toFixed(0)} km</b><span>walked</span></div>
          <div><b>{pet.badgeIds.length}</b><span>badges</span></div>
          <div className="ph-xp"><span className="tiny muted">Level {lvl.level} → {lvl.level + 1}</span><span className="xp-bar"><span style={{ width: `${lvl.pct * 100}%` }} /></span></div>
        </div>
        {packs.length > 0 && (
          <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
            <span className="tiny muted row" style={{ gap: 4 }}><Users size={13} /> Packs:</span>
            {packs.map((p) => <Link key={p.id} to={`/packs/${p.id}`} className="pill" style={{ background: `${p.color}22` }}>{p.icon} {p.name}</Link>)}
          </div>
        )}

        <nav className="tabs" role="tablist">
          {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.icon}<span>{t.label}</span></button>)}
        </nav>

        <div className="tab-body">
          {tab === 'posts' && (posts.length ? <PostGrid posts={posts} /> : <Empty icon={<Camera size={24} strokeWidth={1.75} />} title="No posts yet">{mine && <button className="btn btn-primary" onClick={() => openComposer()}>Share the first one</button>}</Empty>)}
          {tab === 'clips' && (posts.filter((p) => p.kind === 'clip' || p.kind === 'walk').length ? <PostGrid posts={posts.filter((p) => p.kind === 'clip' || p.kind === 'walk')} tall /> : <Empty icon={<Clapperboard size={24} strokeWidth={1.75} />} title="No clips yet" />)}
          {tab === 'memories' && <Memories pet={pet} mine={mine} />}
          {tab === 'diary' && <Diary pet={pet} mine={mine} />}
          {tab === 'albums' && <Albums pet={pet} />}
          {tab === 'badges' && <Badges pet={pet} />}
          {tab === 'card' && (
            <div className="card-stage">
              <button className="card-flip-btn" onClick={() => setFlip((f) => !f)} aria-label="Flip card"><PetCard pet={pet} flip={flip} /></button>
              <div className="col" style={{ gap: 10, maxWidth: 380 }}>
                <h3 className="h2">{pet.name}’s Pet Card</h3>
                <p className="muted">A collectible card generated from {pet.name}’s personality dials, level and quirks. Tap it to flip. Collect cards by making friends, and trade at events.</p>
                <p className="small">Rarity rises with level: Bronze → Silver (LV10) → Gold (LV18) → Legend (LV30).</p>
                <span className="tiny faint">Last updated {timeShort(new Date(Date.now() - 3600_000).toISOString())} ago</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {edit && <EditPet pet={pet} onClose={() => setEdit(false)} />}
    </div>
  );
}
