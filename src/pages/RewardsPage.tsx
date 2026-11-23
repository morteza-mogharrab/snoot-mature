import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Check, Copy, Flame, Footprints, Gift, Lock, MapPin, Siren, Sparkles, Star, Ticket, Users, Vote } from 'lucide-react';
import { useActions, useActivePet, useDb, useUI } from '../store/AppStore';
import { PLACE_META } from '../data/meta';
import { fmtDate, isToday, levelFromXp, timeShort, untilLabel } from '../utils/format';
import { TreatIcon } from '../components/ui/Brand';

const PRIZES = [
  { label: '10', value: 10, color: '#2a2a2c' }, { label: '25', value: 25, color: '#bf5634' }, { label: '5', value: 5, color: '#46617c' },
  { label: '50', value: 50, color: '#3e6a56' }, { label: '15', value: 15, color: '#2a2a2c' }, { label: '100', value: 100, color: '#b08a45' },
  { label: '20', value: 20, color: '#6c5b7b' }, { label: 'Boop', value: 0, color: '#8d8a84' },
];

function SpinWheel() {
  const db = useDb();
  const { spin } = useActions();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const used = isToday(db.rewards.lastSpin);
  const seg = 360 / PRIZES.length;
  const go = () => {
    if (used || spinning) return;
    const weights = [20, 14, 18, 6, 14, 2, 12, 14];
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    let idx = 0;
    while (r > weights[idx]) { r -= weights[idx]; idx++; }
    const target = 360 * 6 + (360 - (idx * seg + seg / 2));
    setSpinning(true);
    setResult(null);
    setAngle((a) => a - (a % 360) + target);
    setTimeout(() => {
      setSpinning(false);
      const p = PRIZES[idx];
      setResult(p.value ? `You won ${p.value} Treats!` : 'No Treats this time. Try again tomorrow.');
      spin(p.value, `${p.value} Treats`);
    }, 4200);
  };
  const grad = PRIZES.map((p, i) => `${p.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(', ');
  return (
    <section className="card card-pad wheel-card">
      <div>
        <p className="eyebrow"><Sparkles size={12} /> Daily game</p>
        <h2 className="h2">Spin & Win</h2>
        <p className="muted small">One free spin a day. Prizes land straight in your Treat jar.</p>
      </div>
      <div className="wheel-wrap">
        <span className="wheel-pointer" aria-hidden="true">▼</span>
        <div className="wheel" style={{ background: `conic-gradient(${grad})`, transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 4.1s cubic-bezier(.15,.85,.2,1)' : 'none' }}>
          {PRIZES.map((p, i) => <span key={i} className="wheel-label" style={{ transform: `rotate(${i * seg + seg / 2}deg) translateY(-92px)` }}>{p.label}</span>)}
        </div>
        <button className="wheel-hub" onClick={go} disabled={used || spinning} aria-label="Spin the wheel">{used ? '✓' : 'SPIN'}</button>
      </div>
      <p className="bold" aria-live="polite" style={{ minHeight: 22, textAlign: 'center' }}>{result ?? (used ? 'Come back tomorrow for another spin' : 'Tap SPIN to play')}</p>
    </section>
  );
}

export function RewardsPage() {
  const db = useDb();
  const pet = useActivePet();
  const { dailyCheckIn, joinChallenge, redeem } = useActions();
  const { toast } = useUI();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const r = db.rewards;
  const lvl = levelFromXp(pet.xp);
  const checked = isToday(r.lastCheckIn);
  const offers = db.places.filter((p) => p.offer);
  const week = Array.from({ length: 7 }, (_, i) => i < (checked ? r.streak % 7 || 7 : r.streak % 7));

  return (
    <div className="page">
      <div className="page-head"><div><h1 className="h1">Treats & rewards</h1><p>Earn Treats by walking, posting and helping neighbours. Spend them on perks from local pet businesses.</p></div></div>
      <div className="rw-top">
        <section className="treat-hero">
          <div className="treat-hero-glow" />
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>Your Treat jar</p>
          <div className="treat-big"><TreatIcon size={46} /><span>{r.treats.toLocaleString()}</span></div>
          <div className="row" style={{ gap: 10 }}>
            <span className="pill" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>{pet.name} · Level {lvl.level}</span>
            <span className="pill" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}><Flame size={12} /> {r.streak}-day streak</span>
          </div>
          <div className="xp-bar light"><span style={{ width: `${lvl.pct * 100}%` }} /></div>
          <p className="tiny" style={{ color: 'rgba(255,255,255,.8)' }}>{lvl.need - lvl.into} XP to level {lvl.level + 1}</p>
        </section>
        <section className="card card-pad streak-card">
          <div className="between"><h3 className="h3">Daily check-in</h3><span className="pill honey"><Flame size={12} /> {r.streak} days</span></div>
          <div className="streak-days">{week.map((on, i) => <span key={i} className={on ? 'on' : ''}>{on ? <Check size={14} strokeWidth={2.5} /> : i + 1}</span>)}</div>
          <button className={`btn btn-block ${checked ? 'btn-soft' : 'btn-primary'}`} disabled={checked} onClick={() => dailyCheckIn()}>
            {checked ? <><Check size={16} /> Checked in today</> : <>Check in · +{10 + Math.min(r.streak + 1, 10) * 5} <TreatIcon size={15} /></>}
          </button>
          <p className="tiny faint">Longer streaks earn more — up to 60 Treats a day.</p>
        </section>
        <SpinWheel />
      </div>

      <section className="section">
        <div className="section-head"><h2 className="h2">Challenges</h2><span className="muted small">Complete them for bonus Treats</span></div>
        <div className="grid-auto">
          {db.challenges.map((c) => (
            <article key={c.id} className="chal card card-pad" style={{ ['--c' as string]: c.color }}>
              <div className="between"><span className="chal-ico">{c.icon}</span><span className="tiny muted">{untilLabel(c.endsAt)}</span></div>
              <h3 className="h3" style={{ marginTop: 10 }}>{c.title}</h3>
              <p className="small muted">{c.description}</p>
              <div className="chal-bar"><span style={{ width: `${(c.progress / c.goal) * 100}%` }} /></div>
              <div className="between tiny"><b>{c.progress} / {c.goal} {c.unit}</b><span className="row" style={{ gap: 4 }}>+{c.reward} <TreatIcon size={13} /></span></div>
              <div className="between" style={{ marginTop: 10 }}>
                <span className="tiny muted row" style={{ gap: 4 }}><Users size={12} /> {c.participants.toLocaleString()}</span>
                <button className={`btn btn-sm ${c.joined ? 'btn-soft' : 'btn-dark'}`} onClick={() => joinChallenge(c.id)}>{c.progress >= c.goal ? 'Complete' : c.joined ? 'Joined' : 'Join'}</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="h2">Redeem with local partners</h2><Link to="/map" className="link small">See on map</Link></div>
        <div className="grid-auto">
          {offers.map((p) => {
            const coupon = db.rewards.coupons.find((c) => c.placeId === p.id);
            const code = codes[p.id] ?? coupon?.code;
            const short = r.treats < p.offer!.cost;
            return (
              <article key={p.id} className="perk card">
                <div className="perk-top" style={{ background: PLACE_META[p.category].soft, color: PLACE_META[p.category].color }}>{PLACE_META[p.category].icon}<span className="tiny bold">{p.name}</span></div>
                <div className="card-pad" style={{ paddingTop: 14 }}>
                  <h3 className="h3"><Ticket size={16} /> {p.offer!.title}</h3>
                  <p className="tiny muted">{p.offer!.detail}</p>
                  {code ? (
                    <button className="coupon-code big" onClick={async () => { try { await navigator.clipboard.writeText(code); toast('Code copied'); } catch { /* noop */ } }}><Copy size={14} /> {code}</button>
                  ) : (
                    <button className="btn btn-dark btn-block btn-sm" style={{ marginTop: 12 }} disabled={short} onClick={() => { const c = redeem(p.id); if (c) { setCodes((x) => ({ ...x, [p.id]: c })); toast('Coupon unlocked 🎟️'); } }}>
                      {short ? <><Lock size={14} /> {p.offer!.cost - r.treats} more needed</> : <>Redeem for {p.offer!.cost} <TreatIcon size={14} /></>}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section rw-bottom">
        <div className="card card-pad">
          <h3 className="h3">How to earn</h3>
          <ul className="earn-list">
            {([[Footprints, 'Walk', '12 per km'], [Camera, 'Post', '10'], [Flame, 'Daily check-in', '15–60'], [MapPin, 'Check in at a place', '5'], [Vote, 'Vote in contests', '2'], [Siren, 'Report a lost-pet sighting', '15'], [Star, 'Review a place', '8']] as const).map(([Ico, l, v]) => (
              <li key={l}><Ico size={16} strokeWidth={1.75} className="muted" /><span className="grow">{l}</span><b className="row" style={{ gap: 4 }}>{v} <TreatIcon size={13} /></b></li>
            ))}
          </ul>
        </div>
        <div className="card card-pad">
          <h3 className="h3">Activity</h3>
          <ul className="ledger">
            {r.ledger.slice(0, 10).map((l) => (
              <li key={l.id}><span className="grow small">{l.reason}</span><span className="tiny faint">{timeShort(l.at)}</span><b className={l.amount > 0 ? 'plus' : 'minus'}>{l.amount > 0 ? '+' : ''}{l.amount}</b></li>
            ))}
          </ul>
          {r.coupons.length > 0 && <><p className="eyebrow" style={{ marginTop: 14 }}><Gift size={12} /> Your coupons</p>{r.coupons.map((c) => <p key={c.id} className="small">{db.places.find((p) => p.id === c.placeId)?.name}: <b>{c.code}</b> <span className="tiny faint">{fmtDate(c.redeemedAt)}</span></p>)}</>}
        </div>
      </section>
    </div>
  );
}
