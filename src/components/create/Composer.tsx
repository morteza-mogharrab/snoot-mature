import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CircleCheck, Hash, ImagePlus, Lightbulb, MapPin, RefreshCw, Sparkles, Trophy, Wand2, X } from 'lucide-react';
import type { MediaItem } from '../../types';
import { useActions, useActivePet, useDb, useUI } from '../../store/AppStore';
import { myPets } from '../../store/selectors';
import { ai, typewriter, type PostIdea, type Tone } from '../../services/ai';
import { SAMPLE_UPLOADS } from '../../data/seed';
import { downscaleImage } from '../../utils/format';
import { Modal, PetAvatar } from '../ui/Kit';
import { TreatIcon } from '../ui/Brand';

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: 'wholesome', label: 'Wholesome', emoji: '🥹' }, { id: 'dramatic', label: 'Dramatic', emoji: '🎭' }, { id: 'sassy', label: 'Sassy', emoji: '💅' },
  { id: 'poetic', label: 'Poetic', emoji: '🍂' }, { id: 'chaotic', label: 'Chaotic', emoji: '⚡️' },
];
const STICKERS = ['Zoomies o’clock ⚡️', 'Rate my nap 1–10', 'Snack time 🦴', 'Good morning!', 'Off to the park 🌳', 'Bath day 😤'];

/** Create flow with built-in AI: pick media → write with Snoot AI → share. */
export function Composer() {
  const db = useDb();
  const active = useActivePet();
  const navigate = useNavigate();
  const { composer, closeComposer, celebrate, toast } = useUI();
  const { createPost, addStory, setActivePet, enterContest } = useActions();
  const [mode, setMode] = useState<'post' | 'story' | 'clip'>(composer?.mode ?? 'post');
  const [media, setMedia] = useState<MediaItem[]>(composer?.media ?? []);
  const [step, setStep] = useState<'pick' | 'write' | 'done'>(composer?.media?.length ? 'write' : 'pick');
  const [caption, setCaption] = useState(composer?.caption ?? '');
  const [tone, setTone] = useState<Tone>('wholesome');
  const [options, setOptions] = useState<string[]>([]);
  const [streamed, setStreamed] = useState('');
  const [busy, setBusy] = useState<'' | 'captions' | 'tags' | 'polish' | 'ideas'>('');
  const [tags, setTags] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [usedAi, setUsedAi] = useState(false);
  const [location, setLocation] = useState('');
  const [withIds, setWithIds] = useState<string[]>([]);
  const [contestId, setContestId] = useState(composer?.contestId ?? '');
  const [sticker, setSticker] = useState('');
  const [drag, setDrag] = useState(false);
  const [idx, setIdx] = useState(0);
  const [newId, setNewId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const stopStream = useRef<() => void>(() => {});
  useEffect(() => () => stopStream.current(), []);

  const add = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 8);
    if (!list.length) { toast('Please choose a photo (JPG, PNG or HEIC exported as JPG)'); return; }
    const srcs = await Promise.all(list.map((f) => downscaleImage(f).catch(() => '')));
    const items = srcs.filter(Boolean).map((src) => ({ src, thumb: src }));
    if (items.length) { setMedia(items); setIdx(0); setStep('write'); }
  };
  const genCaptions = async () => {
    setBusy('captions'); setOptions([]); setStreamed('');
    const out = await ai.captions({ pet: active, tone, context: caption.length < 80 ? caption : undefined });
    setBusy('');
    stopStream.current();
    stopStream.current = typewriter(out[0], setStreamed);
    setOptions(out);
  };
  const genTags = async () => { setBusy('tags'); setTags(await ai.hashtags({ pet: active, caption })); setBusy(''); };
  const polish = async () => { setBusy('polish'); const t = await ai.improve({ pet: active, text: caption }); setCaption(t); setUsedAi(true); setBusy(''); };
  const genIdeas = async () => { setBusy('ideas'); setIdeas(await ai.ideas({ pet: active })); setBusy(''); };
  const use = (t: string) => { setCaption(t); setUsedAi(true); setOptions([]); setStreamed(''); };

  const share = () => {
    if (mode === 'story') {
      media.forEach((m) => addStory(m, sticker || undefined));
      celebrate();
      closeComposer();
      return;
    }
    const id = createPost({
      media, caption: caption.trim(), location: location || undefined, aspect: '1:1', kind: mode === 'clip' ? 'clip' : composer?.walkId ? 'walk' : 'photo',
      walkId: composer?.walkId, withPetIds: withIds.length ? withIds : undefined, aiAssisted: usedAi,
    });
    if (contestId) enterContest(contestId, id);
    setNewId(id);
    setStep('done');
    celebrate();
  };

  const friends = db.followingPetIds.map((id) => db.pets[id]).filter(Boolean).slice(0, 14);
  const openContests = db.contests.filter((c) => new Date(c.endsAt).getTime() > Date.now());

  return (
    <Modal onClose={closeComposer} size={step === 'write' ? 'wide' : 'mid'} label="Create" className="composer">
      <div className="modal-head">
        <div className="row">
          {step === 'write' && !composer?.media && <button className="icon-btn sm" onClick={() => setStep('pick')} aria-label="Back"><ArrowLeft size={20} /></button>}
          <h2 className="h3">{step === 'done' ? 'Shared!' : mode === 'story' ? 'Add to story' : mode === 'clip' ? 'New clip' : 'New post'}</h2>
        </div>
        <div className="row">
          {step !== 'done' && (
            <div className="segmented" role="tablist">
              {(['post', 'clip', 'story'] as const).map((m) => <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)} role="tab" aria-selected={mode === m}>{m[0].toUpperCase() + m.slice(1)}</button>)}
            </div>
          )}
          <button className="icon-btn sm" onClick={closeComposer} aria-label="Close"><X size={20} /></button>
        </div>
      </div>

      {step === 'pick' && (
        <div className="modal-body">
          <div className="as-row">
            <span className="small muted">Posting as</span>
            {myPets(db).map((p) => (
              <button key={p.id} className={`as-chip ${p.id === active.id ? 'on' : ''}`} onClick={() => p.id !== active.id && setActivePet(p.id)}>
                <img src={p.avatar} alt="" />{p.name}
              </button>
            ))}
          </div>
          <div className={`drop ${drag ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e: DragEvent) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}>
            <span className="drop-art"><ImagePlus size={34} /></span>
            <p className="h3">Drop {active.name}’s best photos here</p>
            <p className="muted small">Up to 8 photos for a carousel</p>
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>Choose from device</button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} />
          </div>
          <p className="eyebrow" style={{ margin: '18px 0 10px' }}>Or try a sample photo</p>
          <div className="sample-grid">
            {SAMPLE_UPLOADS.map((m) => <button key={m.src} onClick={() => { setMedia([m]); setStep('write'); }}><img src={m.thumb} alt="" /></button>)}
          </div>
        </div>
      )}

      {step === 'write' && (
        <div className="cmp">
          <div className="cmp-preview">
            <div className={`cmp-frame ${mode !== 'post' ? 'tall' : ''}`}>
              <img src={media[idx]?.src} alt="" />
              {mode === 'story' && sticker && <span className="sv-sticker">{sticker}</span>}
              {media.length > 1 && <div className="pm-dots">{media.map((_, k) => <button key={k} className={k === idx ? 'on' : ''} onClick={() => setIdx(k)} aria-label={`Photo ${k + 1}`} />)}</div>}
            </div>
          </div>
          <div className="cmp-side">
            {mode === 'story' ? (
              <>
                <p className="eyebrow">Add a sticker</p>
                <div className="row wrap">{STICKERS.map((s) => <button key={s} className={`chip ${sticker === s ? 'on' : ''}`} onClick={() => setSticker(sticker === s ? '' : s)}>{s}</button>)}</div>
                <p className="small muted">Stories disappear after 24 hours. You’ll earn <b>5 Treats</b>.</p>
              </>
            ) : (
              <>
                <div className="cmp-who"><PetAvatar pet={active} size={34} /><span className="bold">{active.name}</span><span className="pill lilac"><Sparkles size={12} /> {active.personality.archetype}</span></div>
                <textarea className="textarea cmp-caption" value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 2200))} placeholder={`What’s ${active.name} up to? Write a few words and let Snoot AI do the rest…`} aria-label="Caption" />
                <div className="ai-box">
                  <div className="between"><span className="ai-title"><Wand2 size={16} /> Snoot AI</span><span className="tiny faint">in {active.name}’s voice</span></div>
                  <div className="chips">{TONES.map((t) => <button key={t.id} className={`chip ${tone === t.id ? 'on' : ''}`} onClick={() => setTone(t.id)}>{t.label}</button>)}</div>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <button className="btn btn-dark btn-sm" onClick={genCaptions} disabled={!!busy}>{busy === 'captions' ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />} Write captions</button>
                    <button className="btn btn-soft btn-sm" onClick={genTags} disabled={!!busy}>{busy === 'tags' ? <RefreshCw size={15} className="spin" /> : <Hash size={15} />} Hashtags</button>
                    <button className="btn btn-soft btn-sm" onClick={polish} disabled={!!busy}>{busy === 'polish' ? <RefreshCw size={15} className="spin" /> : <Wand2 size={15} />} Polish</button>
                    <button className="btn btn-soft btn-sm" onClick={genIdeas} disabled={!!busy}>{busy === 'ideas' ? <RefreshCw size={15} className="spin" /> : <Lightbulb size={15} />} Ideas</button>
                  </div>
                  {busy === 'captions' && <div className="ai-thinking"><span /><span /><span /> Sniffing out the perfect words…</div>}
                  {options.length > 0 && (
                    <div className="ai-options">
                      {options.map((o, k) => (
                        <button key={k} className="ai-option" onClick={() => use(o)}>
                          <span>{k === 0 ? streamed || '…' : o}</span><span className="ai-use"><Check size={14} /> Use</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="row wrap" style={{ gap: 6 }}>
                      {tags.map((t) => <button key={t} className="pill coral" onClick={() => { setCaption((c) => (c.includes(t) ? c : `${c.trimEnd()} ${t}`)); setUsedAi(true); }}>{t}</button>)}
                      <button className="link tiny" onClick={() => { setCaption((c) => `${c.trimEnd()} ${tags.filter((t) => !c.includes(t)).join(' ')}`); setUsedAi(true); }}>Add all</button>
                    </div>
                  )}
                  {ideas.length > 0 && (
                    <div className="ai-ideas">
                      {ideas.map((d) => <button key={d.title} className="ai-idea" onClick={() => setCaption(d.prompt)}><span className="ai-idea-emoji">{d.emoji}</span><span><b>{d.title}</b><span className="tiny muted" style={{ display: 'block' }}>{d.prompt}</span></span></button>)}
                    </div>
                  )}
                </div>
                <label className="field"><span><MapPin size={13} /> Location</span>
                  <select className="select" value={location} onChange={(e) => setLocation(e.target.value)}>
                    <option value="">No location</option>
                    {db.places.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </label>
                <div className="field"><span>Tag friends in the photo</span>
                  <div className="hscroll" style={{ gap: 8 }}>
                    {friends.map((f) => (
                      <button key={f.id} className={`as-chip ${withIds.includes(f.id) ? 'on' : ''}`} onClick={() => setWithIds((w) => (w.includes(f.id) ? w.filter((x) => x !== f.id) : [...w, f.id]))}>
                        <img src={f.avatar} alt="" />{f.name}
                      </button>
                    ))}
                  </div>
                </div>
                {openContests.length > 0 && (
                  <label className="field"><span><Trophy size={13} /> Enter a contest</span>
                    <select className="select" value={contestId} onChange={(e) => setContestId(e.target.value)}>
                      <option value="">Don’t enter</option>
                      {openContests.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </label>
                )}
              </>
            )}
            <button className="btn btn-primary btn-lg btn-block" onClick={share}>
              {mode === 'story' ? 'Share to story' : `Share ${mode}`} <span className="row" style={{ gap: 4, opacity: 0.9 }}>+{mode === 'story' ? 5 : 10} <TreatIcon size={16} /></span>
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="modal-body done">
          <span className="done-art"><CircleCheck size={30} strokeWidth={1.75} /></span>
          <h3 className="h2">{active.name}’s {mode} is live</h3>
          <p className="muted">You earned 10 Treats. Keep your streak going tomorrow!</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-soft" onClick={closeComposer}>Back to feed</button>
            <button className="btn btn-primary" onClick={() => { closeComposer(); navigate(`/pet/${active.handle}`); }} disabled={!newId}>View on profile</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
