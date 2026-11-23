import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Clock, Crown, Flame, FastForward, Footprints, Pause, Play, Route, Share2, Square, Target, Timer, Zap } from 'lucide-react';
import type { Walk } from '../types';
import { useActions, useActivePet, useDb, useUI } from '../store/AppStore';
import { leaderboard, myPets, walksFor, walkTotals, weekKm } from '../store/selectors';
import { duration, durationWords, fmtDay, fmtTime, uid } from '../utils/format';
import { generateLoop, pointAlong, routeLength, toKm, UNITS_PER_KM } from '../utils/geo';
import { NeighbourhoodMap } from '../components/map/NeighbourhoodMap';
import { MiniRoute } from '../components/map/MiniRoute';
import { Bars, Modal, ModalHead, Ring, StatTile } from '../components/ui/Kit';
import { TreatIcon } from '../components/ui/Brand';

const MOODS: { id: Walk['mood']; label: string; emoji: string }[] = [
  { id: 'zoomies', label: 'Zoomies', emoji: '⚡️' }, { id: 'sniffy', label: 'Sniffy', emoji: '👃' }, { id: 'chill', label: 'Chill', emoji: '😌' }, { id: 'stubborn', label: 'Stubborn', emoji: '🙃' },
];
/** Average walking pace in km/h used by the tracker simulation. */
const PACE_KMH = 4.8;

/** Live walk tracker. Simulates a GPS track along a generated loop; plug in the Geolocation API for real devices. */
function LiveWalk({ onClose }: { onClose(): void }) {
  const db = useDb();
  const active = useActivePet();
  const { saveWalk } = useActions();
  const { openComposer } = useUI();
  const dogs = myPets(db).filter((p) => p.species === 'dog' || p.id === active.id);
  const [petIds, setPetIds] = useState<string[]>([active.species === 'dog' ? active.id : dogs[0]?.id ?? active.id]);
  const [route] = useState(() => generateLoop(Date.now() % 997, 0.9 + Math.random() * 0.5));
  const total = useMemo(() => routeLength(route), [route]);
  const [state, setState] = useState<'ready' | 'live' | 'paused' | 'done'>('ready');
  const [sec, setSec] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [mood, setMood] = useState<Walk['mood']>('sniffy');
  const [saved, setSaved] = useState<Walk | null>(null);
  const started = useRef(new Date().toISOString());

  useEffect(() => {
    if (state !== 'live') return;
    const id = setInterval(() => setSec((s) => s + speed), 1000);
    return () => clearInterval(id);
  }, [state, speed]);
  const travelled = Math.min(total, (sec / 3600) * PACE_KMH * UNITS_PER_KM);
  const { point, index } = pointAlong(route, travelled);
  const done = route.slice(0, index).concat([point]);
  const km = toKm(travelled);
  useEffect(() => { if (travelled >= total && state === 'live') setState('paused'); }, [travelled, total, state]);

  const finish = () => {
    const walk: Walk = { id: uid('w'), petIds, startedAt: started.current, durationSec: Math.round(sec), distanceKm: +km.toFixed(2), steps: Math.round(km * 1450), route: done.map((p) => [Math.round(p[0]), Math.round(p[1])]), mood };
    if (walk.distanceKm < 0.05) { onClose(); return; }
    saveWalk(walk);
    setSaved(walk);
    setState('done');
  };

  return (
    <Modal onClose={state === 'live' ? () => setState('paused') : onClose} size="wide" label="Walk tracker" className="live-walk">
      <ModalHead title={state === 'done' ? 'Walk complete' : state === 'ready' ? 'Start a walk' : 'Walking…'} onClose={state === 'live' ? () => setState('paused') : onClose} />
      <div className="lw">
        <div className="lw-map">
          <NeighbourhoodMap height="100%" routes={[...(state === 'ready' ? [{ points: route, color: 'rgba(31,27,45,.25)', dashed: true, width: 4 }] : []), { points: done }]} dot={point} focus={point} />
          {state !== 'ready' && state !== 'done' && <span className={`lw-live ${state}`}>{state === 'live' ? '● LIVE' : 'Paused'}</span>}
        </div>
        <div className="lw-side">
          {state === 'ready' && (
            <>
              <p className="eyebrow">Who’s coming?</p>
              <div className="row wrap">{dogs.map((p) => (
                <button key={p.id} className={`as-chip ${petIds.includes(p.id) ? 'on' : ''}`} onClick={() => setPetIds((x) => (x.includes(p.id) ? (x.length > 1 ? x.filter((y) => y !== p.id) : x) : [...x, p.id]))}><img src={p.avatar} alt="" />{p.name}</button>
              ))}</div>
              <p className="small muted">Suggested route: <b>{toKm(total).toFixed(1)} km loop</b> past Larkspur Dog Park · about {Math.round((toKm(total) / PACE_KMH) * 60)} min.</p>
              <button className="btn btn-primary btn-lg btn-block" onClick={() => { started.current = new Date().toISOString(); setState('live'); }}><Play size={18} fill="currentColor" /> Start walking</button>
              <p className="tiny faint">Demo: your position is simulated along the route. On a phone this uses GPS.</p>
            </>
          )}
          {(state === 'live' || state === 'paused') && (
            <>
              <div className="lw-big"><span>{km.toFixed(2)}</span><small>km</small></div>
              <div className="lw-grid">
                <StatTile label="Time" value={duration(sec)} icon={<Timer size={16} />} />
                <StatTile label="Pace" value={km > 0.01 ? `${Math.floor(sec / 60 / km)}:${String(Math.round((sec / km) % 60)).padStart(2, '0')}` : '–'} sub="min/km" icon={<Zap size={16} />} />
                <StatTile label="Steps" value={Math.round(km * 1450).toLocaleString()} icon={<Footprints size={16} />} />
                <StatTile label="Treats" value={`+${Math.max(5, Math.round(km * 12))}`} icon={<TreatIcon size={16} />} />
              </div>
              <div className="field"><span>Walk mood</span><div className="chips">{MOODS.map((m) => <button key={m.id} className={`chip ${mood === m.id ? 'on' : ''}`} onClick={() => setMood(m.id)}>{m.emoji} {m.label}</button>)}</div></div>
              <div className="row">
                {state === 'live'
                  ? <button className="btn btn-soft btn-lg grow" onClick={() => setState('paused')}><Pause size={18} /> Pause</button>
                  : <button className="btn btn-dark btn-lg grow" onClick={() => setState('live')} disabled={travelled >= total}><Play size={18} /> Resume</button>}
                <button className="btn btn-primary btn-lg grow" onClick={finish}><Square size={16} fill="currentColor" /> Finish</button>
              </div>
              <button className={`chip ${speed > 1 ? 'on' : ''}`} style={{ alignSelf: 'flex-start' }} onClick={() => setSpeed((s) => (s === 1 ? 30 : 1))}><FastForward size={14} /> Demo fast-forward {speed > 1 ? 'on' : 'off'}</button>
            </>
          )}
          {state === 'done' && saved && (
            <>
              <div className="lw-big"><span>{saved.distanceKm.toFixed(2)}</span><small>km</small></div>
              <p className="muted">{durationWords(saved.durationSec)} · {saved.steps.toLocaleString()} steps · {MOODS.find((m) => m.id === saved.mood)?.emoji} {saved.mood}</p>
              <div className="earned"><TreatIcon size={26} /><div><b>+{Math.max(5, Math.round(saved.distanceKm * 12))} Treats</b><p className="tiny muted">Added to “November 50” challenge progress</p></div></div>
              <button className="btn btn-primary btn-block" onClick={() => { onClose(); openComposer({ media: [{ src: 'media/p/1141.jpg', thumb: 'media/t/1141.jpg' }], caption: `Walked ${saved.distanceKm.toFixed(1)} km today! 🐾`, walkId: saved.id }); }}><Share2 size={16} /> Share this walk</button>
              <button className="btn btn-soft btn-block" onClick={onClose}><Check size={16} /> Done</button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function WalksPage() {
  const db = useDb();
  const pet = useActivePet();
  const [sp, setSp] = useSearchParams();
  const { setWeeklyGoal } = useActions();
  const [live, setLive] = useState(sp.get('start') === '1');
  const [view, setView] = useState<string | null>(null);
  const walks = walksFor(db, pet.id);
  const week = weekKm(walks);
  const weekTotal = week.reduce((s, d) => s + d.km, 0);
  const totals = walkTotals(walks);
  const board = leaderboard(db).slice(0, 8);
  const sel = walks.find((w) => w.id === view) ?? walks[0];
  const streakDays = (() => { let n = 0; for (let i = 6; i >= 0; i--) { if (week[i].km > 0) n++; else if (i < 6) break; } return n; })();

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="h1">Walks</h1><p>Track adventures, hit your goal and climb the Maplewood leaderboard with {pet.name}.</p></div>
        <button className="btn btn-primary btn-lg" onClick={() => setLive(true)}><Play size={18} fill="currentColor" /> Start a walk</button>
      </div>

      <div className="walk-top">
        <section className="card card-pad goal-card">
          <Ring value={weekTotal / db.weeklyGoalKm} size={150} stroke={14}><span className="ring-big">{weekTotal.toFixed(1)}</span><span className="tiny muted">of {db.weeklyGoalKm} km</span></Ring>
          <div className="col" style={{ gap: 8 }}>
            <p className="eyebrow"><Target size={12} /> Weekly goal</p>
            <p className="h3">{weekTotal >= db.weeklyGoalKm ? 'Weekly goal reached' : `${(db.weeklyGoalKm - weekTotal).toFixed(1)} km to go`}</p>
            <div className="row">{[10, 15, 20, 30].map((g) => <button key={g} className={`chip ${db.weeklyGoalKm === g ? 'on' : ''}`} onClick={() => setWeeklyGoal(g)}>{g} km</button>)}</div>
            <span className="pill honey" style={{ alignSelf: 'flex-start' }}><Flame size={12} /> {streakDays}-day walk streak</span>
          </div>
        </section>
        <section className="card card-pad">
          <div className="between"><h3 className="h3">Last 7 days</h3><span className="tiny muted">{weekTotal.toFixed(1)} km</span></div>
          <Bars data={week.map((d, i) => ({ label: d.label, value: d.km, highlight: i === 6 }))} />
        </section>
      </div>

      <div className="stat-row">
        <StatTile label="Total distance" value={`${totals.km.toFixed(1)} km`} icon={<Route size={18} />} tone="coral" />
        <StatTile label="Walks" value={totals.count} icon={<Footprints size={18} />} tone="mint" />
        <StatTile label="Time outside" value={durationWords(totals.sec)} icon={<Clock size={18} />} tone="sky" />
        <StatTile label="Longest walk" value={`${totals.longest.toFixed(1)} km`} icon={<Crown size={18} />} tone="lilac" />
      </div>

      <div className="walk-grid section">
        <section className="card walk-history">
          <div className="between card-pad" style={{ paddingBottom: 8 }}><h3 className="h3">History</h3><span className="tiny muted">{walks.length} walks</span></div>
          <div className="walk-list">
            {walks.map((w) => (
              <button key={w.id} className={`walk-row ${sel?.id === w.id ? 'on' : ''}`} onClick={() => setView(w.id)}>
                <MiniRoute route={w.route} size={52} />
                <span className="grow" style={{ textAlign: 'left', lineHeight: 1.35 }}>
                  <b>{w.distanceKm.toFixed(2)} km</b> <span className="tiny muted">· {durationWords(w.durationSec)}</span>
                  <span className="tiny muted" style={{ display: 'block' }}>{fmtDay(w.startedAt)} · {fmtTime(w.startedAt)}</span>
                </span>
                <span className="avatars-stack">{w.petIds.map((id) => db.pets[id] && <img key={id} src={db.pets[id].avatar} alt="" />)}</span>
                <span title={w.mood}>{MOODS.find((m) => m.id === w.mood)?.emoji}</span>
              </button>
            ))}
            {!walks.length && <p className="muted small" style={{ padding: 20 }}>No walks yet for {pet.name}. Start one!</p>}
          </div>
        </section>
        {sel && (
          <section className="card walk-detail">
            <NeighbourhoodMap height={330} routes={[{ points: sel.route }]} interactive={false} />
            <div className="card-pad">
              <div className="between"><h3 className="h3">{fmtDay(sel.startedAt)}</h3><span className="pill">{MOODS.find((m) => m.id === sel.mood)?.emoji} {sel.mood}</span></div>
              <div className="row wrap" style={{ gap: 18, marginTop: 10 }}>
                <span><b>{sel.distanceKm.toFixed(2)}</b> <span className="muted small">km</span></span>
                <span><b>{durationWords(sel.durationSec)}</b></span>
                <span><b>{sel.steps.toLocaleString()}</b> <span className="muted small">steps</span></span>
              </div>
              {sel.note && <p className="small muted" style={{ marginTop: 8 }}>“{sel.note}”</p>}
            </div>
          </section>
        )}
        <section className="card card-pad leader">
          <div className="between"><h3 className="h3">Maplewood leaderboard</h3><span className="tiny muted">This week · dogs</span></div>
          <ol className="lb">
            {board.map((r, i) => (
              <li key={r.pet.id} className={r.mine ? 'mine' : ''}>
                <span className={`lb-rank r${i + 1}`}>{i + 1}</span>
                <img src={r.pet.avatar} alt="" />
                <span className="grow small"><b>{r.pet.name}</b>{r.mine && <span className="pill coral" style={{ marginLeft: 6 }}>You</span>}</span>
                <b className="small">{r.km} km</b>
              </li>
            ))}
          </ol>
        </section>
      </div>
      {live && <LiveWalk onClose={() => { setLive(false); if (sp.get('start')) setSp({}, { replace: true }); }} />}
    </div>
  );
}
