import { useRef, useState } from 'react';
import { ArrowLeft, Camera, RefreshCw, ScanSearch, Sparkles } from 'lucide-react';
import type { Pet, PetStats, Personality, Species } from '../../types';
import { useActions, useDb } from '../../store/AppStore';
import { ai, type BreedGuess } from '../../services/ai';
import { STAT_LABELS } from '../../data/meta';
import { downscaleImage } from '../../utils/format';
import { Modal, ModalHead } from '../ui/Kit';
import { PetCard } from './PetCard';
import { SAMPLE_UPLOADS } from '../../data/seed';

const TRAITS = ['Velcro dog', 'Zoomies', 'Couch potato', 'Foodie', 'Explorer', 'Talker', 'Gentle', 'Escape artist', 'Show-off', 'Shy at first', 'Water lover', 'Snuggler'];

/** Add a new pet: photo + AI breed guess → basics → personality dials → AI personality → done. */
export function AddPetWizard({ onClose }: { onClose(): void }) {
  const db = useDb();
  const { createPet } = useActions();
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState('');
  const [guesses, setGuesses] = useState<BreedGuess[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<'boy' | 'girl'>('girl');
  const [birthday, setBirthday] = useState(() => new Date(Date.now() - 2 * 365 * 86_400_000).toISOString().slice(0, 10));
  const [traits, setTraits] = useState<string[]>([]);
  const [stats, setStats] = useState<PetStats>({ energy: 60, cuddles: 70, mischief: 50, appetite: 70, social: 60 });
  const [persona, setPersona] = useState<Personality | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const scan = async (src: string, fileName: string) => {
    setPhoto(src);
    setScanning(true);
    const g = await ai.identify({ fileName });
    setGuesses(g);
    setScanning(false);
    setSpecies(g[0].species);
    setBreed(g[0].breed);
  };
  const genPersona = async () => {
    setBusy(true);
    setPersona(await ai.personality({ pet: { name: name || 'Your pet', species, breed: breed || 'mixed breed', stats, traits } }));
    setBusy(false);
  };
  const [suffix] = useState(() => Math.floor(Math.random() * 90 + 10));
  const handle = (name || 'pet').toLowerCase().replace(/[^a-z0-9]/g, '') + suffix;
  const draft: Pet = {
    id: handle, handle, name: name || 'Your pet', species, breed: breed || 'Mixed breed', sex, birthday: new Date(birthday).toISOString(),
    avatar: photo || SAMPLE_UPLOADS[0].src, cover: 'media/p/1310.jpg', bio: persona?.summary ?? '', traits, favorites: ['Treats', 'Naps'],
    stats, personality: persona ?? { archetype: 'Mystery Pet', summary: '', quirks: [], voice: 'wholesome' }, ownerId: db.meId,
    followers: 0, following: 0, badgeIds: ['first-boop'], neighbourhood: db.owners[db.meId].city, xp: 100,
  };
  const finish = () => { createPet({ ...draft, bio: persona ? `${persona.summary.split('.')[0]}.` : `Hi, I’m ${draft.name}!` }); onClose(); };

  return (
    <Modal onClose={onClose} size="mid" label="Add a pet">
      <ModalHead title={['Add a pet', 'The basics', 'Personality', 'Meet your Pet Card'][step]} onClose={onClose}
        left={step > 0 ? <button className="icon-btn sm" onClick={() => setStep(step - 1)} aria-label="Back"><ArrowLeft size={18} /></button> : undefined} />
      <div className="modal-body">
        <div className="steps">{[0, 1, 2, 3].map((s) => <span key={s} className={s <= step ? 'on' : ''} />)}</div>
        {step === 0 && (
          <div className="col" style={{ gap: 16 }}>
            <p className="muted">Start with a photo — Snoot AI will guess the species and breed (over 10,000 recognised in the full version).</p>
            <div className="wiz-photo">
              {photo ? <img src={photo} alt="" /> : <Camera size={36} className="faint" />}
              {scanning && <div className="scan"><ScanSearch size={26} /><span>Identifying…</span></div>}
            </div>
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => fileRef.current?.click()}><Camera size={16} /> Upload a photo</button>
              <button className="btn btn-soft" onClick={() => scan(SAMPLE_UPLOADS[2].src, 'sample-dog.jpg')}>Use a sample</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) scan(await downscaleImage(f, 600), f.name); }} />
            {guesses && (
              <div className="guesses">
                {guesses.map((g, i) => (
                  <button key={g.breed + i} className={`guess ${breed === g.breed ? 'on' : ''}`} onClick={() => { setBreed(g.breed); setSpecies(g.species); }}>
                    <span>{g.breed}</span>
                    <span className="guess-bar"><span style={{ width: `${g.confidence * 100}%` }} /></span>
                    <span className="tiny bold">{Math.round(g.confidence * 100)}%</span>
                  </button>
                ))}
              </div>
            )}
            <button className="btn btn-dark btn-block" onClick={() => setStep(1)}>{photo ? 'Continue' : 'Skip for now'}</button>
          </div>
        )}
        {step === 1 && (
          <div className="col" style={{ gap: 14 }}>
            <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pickle" autoFocus /></label>
            <div className="field"><span>Species</span>
              <div className="chips">{(['dog', 'cat', 'bird', 'small', 'fish'] as Species[]).map((s) => <button key={s} className={`chip ${species === s ? 'on' : ''}`} onClick={() => setSpecies(s)}>{s === 'small' ? 'Small pet' : s[0].toUpperCase() + s.slice(1)}</button>)}</div>
            </div>
            <label className="field"><span>Breed</span><input className="input" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Mixed breed" /></label>
            <div className="row wrap" style={{ gap: 14 }}>
              <div className="field grow"><span>Sex</span><div className="segmented"><button className={sex === 'girl' ? 'on' : ''} onClick={() => setSex('girl')}>Girl</button><button className={sex === 'boy' ? 'on' : ''} onClick={() => setSex('boy')}>Boy</button></div></div>
              <label className="field grow"><span>Birthday (or best guess)</span><input type="date" className="input" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></label>
            </div>
            <button className="btn btn-dark btn-block" disabled={!name.trim()} onClick={() => setStep(2)}>Continue</button>
          </div>
        )}
        {step === 2 && (
          <div className="col" style={{ gap: 14 }}>
            <p className="muted">Tune {name || 'your pet'}’s personality dials. They power PawMatch playdates and the AI voice.</p>
            {(Object.keys(stats) as (keyof PetStats)[]).map((k) => (
              <label key={k} className="dial">
                <span className="between"><span className="bold">{STAT_LABELS[k].label}</span><span className="tiny muted">{stats[k]}</span></span>
                <input type="range" className="range" min={0} max={100} value={stats[k]} onChange={(e) => setStats({ ...stats, [k]: +e.target.value })} style={{ accentColor: STAT_LABELS[k].color }} />
              </label>
            ))}
            <div className="field"><span>Traits</span>
              <div className="row wrap" style={{ gap: 6 }}>{TRAITS.map((t) => <button key={t} className={`chip ${traits.includes(t) ? 'on' : ''}`} onClick={() => setTraits((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t].slice(0, 4)))}>{t}</button>)}</div>
            </div>
            <button className="btn btn-dark btn-block" onClick={() => { setStep(3); genPersona(); }}><Sparkles size={16} /> Generate personality</button>
          </div>
        )}
        {step === 3 && (
          <div className="wiz-final">
            <div style={{ justifySelf: 'center' }}>{busy ? <div className="petcard sk" style={{ height: 420 }} /> : <PetCard pet={draft} />}</div>
            <div className="col" style={{ gap: 12 }}>
              {persona && (
                <>
                  <span className="pill lilac" style={{ alignSelf: 'flex-start' }}><Sparkles size={12} /> AI personality</span>
                  <h3 className="h2">{persona.archetype}</h3>
                  <p className="muted">{persona.summary}</p>
                  <ul className="col small" style={{ gap: 6 }}>{persona.quirks.map((q) => <li key={q}>✦ {q}</li>)}</ul>
                </>
              )}
              <div className="row wrap">
                <button className="btn btn-soft" onClick={genPersona} disabled={busy}><RefreshCw size={16} className={busy ? 'spin' : ''} /> Regenerate</button>
                <button className="btn btn-primary grow" onClick={finish} disabled={busy}>Create {name}’s profile</button>
              </div>
              <p className="tiny faint">You’ll earn 50 Treats and {name} will become your active pet.</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
