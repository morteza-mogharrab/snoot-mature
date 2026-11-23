import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Cake, CalendarHeart, CircleCheck, Flame, Footprints, MessageCircleHeart, Siren, Sparkles, Trophy } from 'lucide-react';
import { useActions, useActivePet, useDb, useMe, useUI } from '../store/AppStore';
import { feed, pawMatches, suggestedPets, upcomingBirthdays, walksFor, weekKm, type FeedTab } from '../store/selectors';
import { useInfinite } from '../hooks';
import { fmtDay, fmtTime, isToday, timeShort, untilLabel } from '../utils/format';
import { PostCard } from '../components/feed/PostCard';
import { StoriesBar } from '../components/stories/Stories';
import { Bars, PetAvatar, Ring } from '../components/ui/Kit';
import { TreatIcon } from '../components/ui/Brand';
import { EVENT_META } from '../data/meta';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function TodayCard() {
  const db = useDb();
  const me = useMe();
  const pet = useActivePet();
  const navigate = useNavigate();
  const { dailyCheckIn } = useActions();
  const { openPetChat } = useUI();
  const week = weekKm(walksFor(db, pet.id));
  const km = week.reduce((s, d) => s + d.km, 0);
  const checked = isToday(db.rewards.lastCheckIn);
  const bday = upcomingBirthdays(db, 30).find((b) => b.pet.ownerId === db.meId);
  return (
    <section className="today card">
      <div className="today-main">
        <p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="h1">{greeting()}, {me.name.split(' ')[0]}</h1>
        <p className="muted">{pet.name} has walked <b className="ink">{km.toFixed(1)} km</b> this week{km >= db.weeklyGoalKm ? ' — weekly goal reached.' : ` — ${Math.max(0, db.weeklyGoalKm - km).toFixed(1)} km to go.`}</p>
        <div className="row wrap" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={() => navigate('/walks?start=1')}><Footprints size={18} /> Start a walk</button>
          <button className="btn btn-soft" onClick={() => openPetChat(pet.id)}><MessageCircleHeart size={18} /> Talk to {pet.name}</button>
          <button className={`btn ${checked ? 'btn-soft' : 'btn-outline'}`} onClick={() => dailyCheckIn()} disabled={checked}>
            <Flame size={18} className={checked ? 'flame-on' : ''} /> {checked ? `${db.rewards.streak}-day streak` : 'Daily check-in'}
          </button>
        </div>
      </div>
      <div className="today-ring">
        <Ring value={km / db.weeklyGoalKm} size={124} stroke={12}>
          <span className="ring-big">{Math.round((km / db.weeklyGoalKm) * 100)}%</span>
          <span className="tiny muted">of {db.weeklyGoalKm} km</span>
        </Ring>
      </div>
      {bday && (
        <Link to={`/pet/${bday.pet.handle}?tab=memories`} className="today-bday">
          <span className="bday-emoji"><Cake size={18} /></span>
          <span className="grow"><b>{bday.pet.name} turns {bday.turning} {bday.days === 0 ? 'today!' : `in ${bday.days} days`}</b><span className="tiny muted" style={{ display: 'block' }}>Plan something, order a cake from Crumb & Co. or make a birthday card with AI</span></span>
          <ArrowRight size={18} />
        </Link>
      )}
    </section>
  );
}

function MatchStrip() {
  const db = useDb();
  const pet = useActivePet();
  const navigate = useNavigate();
  const { openConversation, sendMessage } = useActions();
  const { toast } = useUI();
  const matches = pawMatches(db, pet.id, 6);
  if (!matches.length) return null;
  return (
    <section className="module card">
      <div className="between" style={{ marginBottom: 12 }}>
        <div><p className="eyebrow">PawMatch</p><h3 className="h3">Playdate picks for {pet.name}</h3></div>
        <Link to="/discover?tab=match" className="link small">See all</Link>
      </div>
      <div className="hscroll">
        {matches.map((m) => (
          <div key={m.pet.id} className="match-mini">
            <Link to={`/pet/${m.pet.handle}`}><img src={m.pet.avatar} alt="" /></Link>
            <span className="match-score">{m.score}%</span>
            <b className="ellipsis">{m.pet.name}</b>
            <span className="tiny muted ellipsis">{m.reasons[0]}</span>
            <button className="btn btn-soft btn-sm" onClick={() => {
              const id = openConversation(m.pet.id);
              sendMessage(id, `Hi ${m.pet.name}! Snoot says we’re a ${m.score}% match. Playdate at Larkspur this week?`);
              toast(`Playdate request sent to ${m.pet.name}`);
              navigate(`/messages/${id}`);
            }}>Say hi</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContestPromo() {
  const db = useDb();
  const c = db.contests.find((x) => new Date(x.endsAt).getTime() > Date.now());
  if (!c) return null;
  const top = [...c.entries].sort((a, b) => b.votes - a.votes).slice(0, 3);
  return (
    <Link to="/contests" className="module promo card" style={{ ['--promo' as string]: c.color }}>
      <div className="grow">
        <p className="eyebrow"><Trophy size={12} /> Weekly contest · {untilLabel(c.endsAt)}</p>
        <h3 className="h2">{c.title}</h3>
        <p className="muted small">{c.theme}</p>
        <span className="btn btn-dark btn-sm" style={{ marginTop: 12 }}>Vote & enter <ArrowRight size={15} /></span>
      </div>
      <div className="promo-stack">{top.map((e) => <img key={e.id} src={e.media.thumb} alt="" />)}</div>
    </Link>
  );
}

function RightRail() {
  const db = useDb();
  const pet = useActivePet();
  const { follow } = useActions();
  const week = weekKm(walksFor(db, pet.id));
  const events = [...db.events].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);
  const lost = db.lost.find((l) => l.status === 'lost');
  return (
    <aside className="rail">
      <section className="card card-pad">
        <div className="between"><h3 className="h3">This week</h3><Link to="/walks" className="link small">Walks</Link></div>
        <Bars data={week.map((d, i) => ({ label: d.label, value: d.km, highlight: i === 6 }))} />
      </section>
      {lost && (
        <Link to="/lost" className="card card-pad lost-mini">
          <img src={lost.photo.thumb} alt="" />
          <div className="grow">
            <p className="pill coral"><Siren size={12} /> Lost nearby · {timeShort(lost.createdAt)}</p>
            <p className="bold" style={{ marginTop: 6 }}>Have you seen {lost.petName}?</p>
            <p className="tiny muted clamp2">{lost.lastSeen}</p>
          </div>
        </Link>
      )}
      <section className="card card-pad">
        <div className="between"><h3 className="h3">Coming up</h3><Link to="/events" className="link small">All events</Link></div>
        <div className="col" style={{ marginTop: 10, gap: 12 }}>
          {events.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="ev-mini">
              <span className="ev-date"><b>{new Date(e.start).getDate()}</b><span>{new Date(e.start).toLocaleDateString('en-US', { month: 'short' })}</span></span>
              <span className="grow" style={{ lineHeight: 1.3 }}><b className="small clamp2">{e.title}</b><span className="tiny muted" style={{ display: 'block' }}>{fmtDay(e.start)} · {fmtTime(e.start)}</span></span>
              <span className="ev-dot" style={{ background: EVENT_META[e.category].color }} />
            </Link>
          ))}
        </div>
      </section>
      <section className="card card-pad">
        <h3 className="h3">Pets to follow</h3>
        <div className="col" style={{ marginTop: 10, gap: 10 }}>
          {suggestedPets(db, 4).map((p) => (
            <div key={p.id} className="row">
              <PetAvatar pet={p} size={40} link />
              <Link to={`/pet/${p.handle}`} className="grow" style={{ lineHeight: 1.3 }}><b className="small">{p.name}</b><span className="tiny muted" style={{ display: 'block' }}>{p.breed}</span></Link>
              <button className="btn btn-soft btn-sm" onClick={() => follow(p.id)}>Follow</button>
            </div>
          ))}
        </div>
      </section>
      <Link to="/rewards" className="card card-pad treats-mini">
        <TreatIcon size={30} />
        <div className="grow"><b>{db.rewards.treats.toLocaleString()} Treats</b><span className="tiny muted" style={{ display: 'block' }}>Spin the wheel & redeem local perks</span></div>
        <ArrowRight size={18} />
      </Link>
      <p className="sample-note" style={{ padding: '0 6px' }}>Snoot is a demo — every pet, person, place and event here is sample content.</p>
    </aside>
  );
}

export function HomePage() {
  const db = useDb();
  const [tab, setTab] = useState<FeedTab>('foryou');
  const posts = useMemo(() => feed(db, tab), [db, tab]);
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const more = count < posts.length;
  const sentinel = useInfinite(() => {
    if (loading || !more) return;
    setLoading(true);
    setTimeout(() => { setCount((c) => c + 5); setLoading(false); }, 450);
  }, more);

  return (
    <div className="home">
      <div className="home-main">
        <TodayCard />
        <StoriesBar />
        <div className="feed-tabs">
          <div className="segmented">
            {([['foryou', 'For you'], ['following', 'Following'], ['nearby', 'Nearby']] as const).map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setCount(6); }}>{l}</button>
            ))}
          </div>
          <span className="tiny faint row" style={{ gap: 4 }}><Sparkles size={12} /> Personalised for {useActivePet().name}</span>
        </div>
        <div className="feed">
          {posts.slice(0, count).map((p, i) => (
            <div key={p.id} className="feed-item">
              {i === 2 && <MatchStrip />}
              {i === 5 && <ContestPromo />}
              {i === 8 && (
                <Link to="/events" className="module card ev-promo">
                  <CalendarHeart size={28} /><div className="grow"><b>{db.events.length} pet events this month</b><p className="tiny muted">Pack walks, adoption days, shows and yappy hours near you</p></div><ArrowRight size={18} />
                </Link>
              )}
              <PostCard post={p} />
            </div>
          ))}
          {loading && <div className="post card"><div className="sk" style={{ height: 420 }} /></div>}
          <div ref={sentinel} />
          {!more && <div className="feed-end"><span><CircleCheck size={28} strokeWidth={1.5} /></span><p className="h3">You’re all caught up</p><p className="muted small">Go outside — Juniper says it’s walk o’clock.</p></div>}
        </div>
      </div>
      <RightRail />
    </div>
  );
}
