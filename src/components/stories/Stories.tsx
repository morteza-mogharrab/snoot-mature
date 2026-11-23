import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play, Plus, Send, X } from 'lucide-react';
import { useActions, useActivePet, useDb, useUI } from '../../store/AppStore';
import { orderedStories, unseen } from '../../store/selectors';
import { timeShort } from '../../utils/format';
import { BoopIcon } from '../ui/Brand';

export function StoriesBar() {
  const db = useDb();
  const active = useActivePet();
  const { openStories, openComposer } = useUI();
  const stories = orderedStories(db);
  const mine = stories.find((s) => s.petId === active.id);
  const others = stories.filter((s) => !db.owners[db.meId].petIds.includes(s.petId));
  const ids = [...(mine ? [mine.id] : []), ...others.map((s) => s.id)];
  return (
    <div className="stories hscroll" aria-label="Stories">
      <div className="story">
        <button className={`story-ring ${mine ? (unseen(mine) ? '' : 'seen') : 'add'}`}
          onClick={() => (mine ? openStories({ storyIds: ids, startIndex: 0 }) : openComposer({ mode: 'story' }))} aria-label="Your story">
          <img src={active.avatar} alt="" />
          {!mine && <span className="story-plus"><Plus size={14} strokeWidth={3} /></span>}
        </button>
        <span className="story-name">Your story</span>
      </div>
      {others.map((s) => {
        const p = db.pets[s.petId];
        return (
          <div className="story" key={s.id}>
            <button className={`story-ring ${unseen(s) ? '' : 'seen'}`} onClick={() => openStories({ storyIds: ids, startIndex: ids.indexOf(s.id) })} aria-label={`${p.name}'s story`}>
              <img src={p.avatar} alt="" loading="lazy" />
            </button>
            <span className={`story-name ${unseen(s) ? '' : 'faint'}`}>{p.name.split(' ')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

const DURATION = 5200;

export function StoryViewer() {
  const db = useDb();
  const { storyViewer, closeStories, toast } = useUI();
  const { markStorySeen, openConversation, sendMessage } = useActions();
  const reels = useMemo(() => (storyViewer?.storyIds ?? []).map((id) => db.stories.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s && s.items.length > 0),
    // snapshot on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storyViewer]);
  const [r, setR] = useState(storyViewer?.startIndex ?? 0);
  const [i, setI] = useState(() => { const s = reels[storyViewer?.startIndex ?? 0]; return s && s.seenUpTo < s.items.length ? s.seenUpTo : 0; });
  const [prog, setProg] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [typing, setTyping] = useState(false);
  const [reply, setReply] = useState('');
  const [booped, setBooped] = useState<Record<string, boolean>>({});
  const elapsed = useRef(0);
  const reel = reels[r];
  const item = reel?.items[i];
  const pet = reel ? db.pets[reel.petId] : undefined;

  const next = useCallback(() => {
    elapsed.current = 0; setProg(0);
    if (!reel) return;
    if (i < reel.items.length - 1) setI(i + 1);
    else if (r < reels.length - 1) { setR(r + 1); setI(0); }
    else closeStories();
  }, [reel, i, r, reels.length, closeStories]);
  const prev = useCallback(() => {
    elapsed.current = 0; setProg(0);
    if (i > 0) setI(i - 1); else if (r > 0) { setR(r - 1); setI(0); }
  }, [i, r]);

  useEffect(() => { if (reel) markStorySeen(reel.id, i + 1); }, [reel, i, markStorySeen]);
  useEffect(() => {
    if (!item || paused || hold || typing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      elapsed.current += t - last; last = t;
      const p = Math.min(1, elapsed.current / DURATION);
      setProg(p);
      if (p >= 1) next(); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item, paused, hold, typing, next]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') { if (e.key === 'Escape') closeStories(); return; }
      if (e.key === 'Escape') closeStories();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', k);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', k); document.body.classList.remove('modal-open'); };
  }, [next, prev, closeStories]);

  if (!reel || !item || !pet) return null;
  const mine = db.owners[db.meId].petIds.includes(pet.id);
  const send = (t: string) => {
    if (!t.trim()) return;
    sendMessage(openConversation(pet.id), `Replied to your story: ${t}`);
    setReply('');
    toast(`Sent to ${pet.name}`);
  };

  return createPortal(
    <div className="sv" role="dialog" aria-modal="true" aria-label={`${pet.name}'s story`}>
      <div className="sv-bg" style={{ backgroundImage: `url(${item.media.src})` }} />
      <button className="sv-close" onClick={closeStories} aria-label="Close"><X size={26} /></button>
      <div className="sv-card">
        <div className="sv-bars">{reel.items.map((_, k) => <span key={k}><span style={{ width: `${k < i ? 100 : k === i ? prog * 100 : 0}%` }} /></span>)}</div>
        <header className="sv-head">
          <Link to={`/pet/${pet.handle}`} onClick={closeStories} className="row" style={{ gap: 10 }}>
            <img src={pet.avatar} alt="" className="sv-av" /><span><b>{pet.name}</b> <span className="sv-time">{timeShort(item.createdAt)}</span></span>
          </Link>
          <button className="sv-ctl" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>{paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}</button>
        </header>
        <img key={item.id} src={item.media.src} alt="" className="sv-img" draggable={false} />
        {item.sticker && <span className="sv-sticker">{item.sticker}</span>}
        <div className="sv-tap" onPointerDown={() => setHold(true)} onPointerUp={() => setHold(false)} onPointerLeave={() => setHold(false)}>
          <button onClick={prev} aria-label="Previous" style={{ width: '32%' }} />
          <button onClick={next} aria-label="Next" style={{ width: '68%' }} />
        </div>
        <footer className="sv-foot">
          {mine ? <span className="bold small">Seen by {18 + i * 9}</span> : (
            <>
              <form className="sv-reply" onSubmit={(e) => { e.preventDefault(); send(reply); }}>
                <input value={reply} onChange={(e) => setReply(e.target.value)} onFocus={() => setTyping(true)} onBlur={() => setTyping(false)} placeholder={`Reply to ${pet.name}…`} aria-label="Reply" />
              </form>
              <button className={`sv-icon ${booped[item.id] ? 'on' : ''}`} onClick={() => setBooped((b) => ({ ...b, [item.id]: !b[item.id] }))} aria-label="Boop story"><BoopIcon size={26} filled={booped[item.id]} /></button>
              <button className="sv-icon" onClick={() => send(reply || '🐾')} aria-label="Send"><Send size={22} /></button>
            </>
          )}
        </footer>
        {(r > 0 || i > 0) && <button className="sv-nav prev" onClick={prev} aria-label="Previous"><ChevronLeft size={20} /></button>}
        <button className="sv-nav next" onClick={next} aria-label="Next"><ChevronRight size={20} /></button>
      </div>
    </div>,
    document.body,
  );
}
