import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MessageCircle, Music2, Play, Send, Volume2, VolumeX } from 'lucide-react';
import type { Post } from '../types';
import { useActions, useDb, useUI } from '../store/AppStore';
import { clips } from '../store/selectors';
import { useDoubleTap } from '../hooks';
import { compact } from '../utils/format';
import { BoopIcon, TreatIcon } from '../components/ui/Brand';
import { Rich } from '../components/ui/Kit';

/**
 * Short-video discovery. The sample library has photos only, so clips play as
 * slow cinematic pans; swap <img> for <video> once real clips exist.
 */
function Clip({ post, active, muted, setMuted }: { post: Post; active: boolean; muted: boolean; setMuted(m: boolean): void }) {
  const db = useDb();
  const { boop, boopOnly, giveTreat, toggleSave, follow } = useActions();
  const { openPost, setShareTarget } = useUI();
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);
  const [flash, setFlash] = useState(0);
  const pet = db.pets[post.petId];
  const tap = useDoubleTap(() => { boopOnly(post.id); setBurst((b) => b + 1); }, () => { setPaused((p) => !p); setFlash((f) => f + 1); });
  const run = active && !paused;
  const followed = db.followingPetIds.includes(pet.id) || db.owners[db.meId].petIds.includes(pet.id);
  return (
    <section className="clip">
      <div className="clip-frame" onClick={tap}>
        <img src={post.media[0].src} alt="" className={`clip-img ${run ? 'run' : ''}`} draggable={false} />
        <div className="clip-progress"><span className={run ? 'run' : ''} /></div>
        {flash > 0 && paused && <span className="clip-flash" key={flash}><Play size={36} fill="currentColor" /></span>}
        {burst > 0 && <span key={burst} className="boop-burst"><BoopIcon size={110} filled /></span>}
        <div className="clip-info" onClick={(e) => e.stopPropagation()}>
          <div className="row" style={{ gap: 10 }}>
            <Link to={`/pet/${pet.handle}`}><img src={pet.avatar} alt="" className="clip-av" /></Link>
            <Link to={`/pet/${pet.handle}`} className="bold">{pet.name}</Link>
            {!followed && <button className="clip-follow" onClick={() => follow(pet.id)}>Follow</button>}
          </div>
          <p className="clip-cap"><Rich text={post.caption} /></p>
          <span className="clip-sound"><Music2 size={13} /><span className="marquee"><span>{post.audio ?? `Original sound · ${pet.handle}`}</span></span></span>
        </div>
        <button className="clip-mute" onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
      </div>
      <div className="clip-rail">
        <button className={`clip-act ${post.boopedByMe ? 'boop-on' : ''}`} onClick={() => boop(post.id)} aria-label="Boop"><span className="clip-circle"><BoopIcon size={26} filled={post.boopedByMe} /></span>{compact(post.boops)}</button>
        <button className="clip-act" onClick={() => openPost(post.id)} aria-label="Comments"><span className="clip-circle"><MessageCircle size={24} /></span>{compact(post.commentCount)}</button>
        <button className="clip-act" onClick={() => giveTreat(post.id)} aria-label="Give treat"><span className="clip-circle"><TreatIcon size={24} /></span>{compact(post.treats)}</button>
        <button className="clip-act" onClick={() => toggleSave(post.id)} aria-label="Save"><span className="clip-circle"><Bookmark size={23} fill={post.savedByMe ? 'currentColor' : 'none'} /></span>Save</button>
        <button className="clip-act" onClick={() => setShareTarget(post.id)} aria-label="Share"><span className="clip-circle"><Send size={22} /></span>Share</button>
        <Link to={`/pet/${pet.handle}`} className="clip-disc" aria-label="Sound"><img src={pet.avatar} alt="" /></Link>
      </div>
    </section>
  );
}

export function ClipsPage() {
  const db = useDb();
  const [list] = useState(() => {
    const c = clips(db);
    const extra = Object.values(db.posts).filter((p) => p.kind === 'photo' && p.media.length === 1 && p.aspect === '4:5').slice(0, 6);
    return [...c, ...extra].map((p) => p.id);
  });
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(+(e.target as HTMLElement).dataset.i!)), { root, threshold: 0.6 });
    root.querySelectorAll('[data-i]').forEach((el) => io.observe(el));
    const k = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); root.scrollBy({ top: root.clientHeight, behavior: 'smooth' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); root.scrollBy({ top: -root.clientHeight, behavior: 'smooth' }); }
    };
    window.addEventListener('keydown', k);
    return () => { io.disconnect(); window.removeEventListener('keydown', k); };
  }, [list.length]);
  return (
    <div className="clips" ref={box}>
      {list.map((id, i) => db.posts[id] && <div key={id} className="clip-snap" data-i={i}><Clip post={db.posts[id]} active={i === active} muted={muted} setMuted={setMuted} /></div>)}
    </div>
  );
}
