import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, CalendarHeart, Check, ChevronDown, Clapperboard, Compass, Footprints, Gift, HeartHandshake, Home, LogOut, Map as MapIcon,
  MessageCircle, Moon, Plus, RotateCcw, Siren, Sparkles, Sun, Trophy, Users, X, Menu,
} from 'lucide-react';
import { useActions, useActivePet, useDb, useMe, useUI } from '../../store/AppStore';
import { myPets, unreadDms, unreadNotifs } from '../../store/selectors';
import { useClickOutside } from '../../hooks';
import { LogoMark, TreatIcon, Wordmark } from '../ui/Brand';
import { PetAvatar } from '../ui/Kit';
import { NotificationList } from './Notifications';
import { AddPetWizard } from '../profile/AddPetWizard';
import { fmtNum, levelFromXp } from '../../utils/format';

const PRIMARY = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/clips', label: 'Clips', icon: Clapperboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/walks', label: 'Walks', icon: Footprints },
  { to: '/events', label: 'Events', icon: CalendarHeart },
  { to: '/packs', label: 'Packs', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageCircle, badge: 'dm' as const },
];
const SECONDARY = [
  { to: '/rewards', label: 'Treats & rewards', icon: Gift },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/adopt', label: 'Adopt', icon: HeartHandshake },
  { to: '/lost', label: 'Lost & found', icon: Siren },
];

/** Pet switcher: pick which of your pets you're posting and commenting as. */
export function PetSwitcher({ compact = false }: { compact?: boolean }) {
  const db = useDb();
  const active = useActivePet();
  const { setActivePet } = useActions();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const lvl = levelFromXp(active.xp);
  return (
    <div className="switcher" ref={ref}>
      <button className="switcher-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Switch pet">
        <PetAvatar pet={active} size={compact ? 36 : 44} />
        {!compact && (
          <span className="switcher-text">
            <span className="switcher-name">{active.name}</span>
            <span className="switcher-sub">Level {lvl.level} · {active.breed}</span>
          </span>
        )}
        {!compact && <ChevronDown size={18} className="faint" />}
      </button>
      {open && (
        <div className="switcher-menu" role="menu">
          <p className="eyebrow" style={{ padding: '6px 10px' }}>Posting as</p>
          {myPets(db).map((p) => (
            <button key={p.id} role="menuitem" className="switcher-item" onClick={() => { if (p.id !== active.id) setActivePet(p.id); setOpen(false); }}>
              <PetAvatar pet={p} size={36} />
              <span className="grow" style={{ textAlign: 'left' }}><span className="bold">{p.name}</span><span className="tiny muted" style={{ display: 'block' }}>{p.breed}</span></span>
              {p.id === active.id && <Check size={18} className="verified" />}
            </button>
          ))}
          <button className="switcher-item add" onClick={() => { setOpen(false); setAdding(true); }}>
            <span className="add-ico"><Plus size={18} /></span><span className="bold">Add a pet</span>
          </button>
          <Link to={`/pet/${active.handle}`} className="switcher-foot" onClick={() => setOpen(false)}>View {active.name}’s profile</Link>
        </div>
      )}
      {adding && <AddPetWizard onClose={() => setAdding(false)} />}
    </div>
  );
}

export function TreatBalance() {
  const db = useDb();
  return (
    <Link to="/rewards" className="treat-pill" title="Your Treats">
      <TreatIcon size={18} />
      <span>{fmtNum(db.rewards.treats)}</span>
    </Link>
  );
}

export function Sidebar() {
  const db = useDb();
  const me = useMe();
  const { openComposer, toggleTheme, theme } = useUI();
  const { resetDemo } = useActions();
  const dms = unreadDms(db);
  return (
    <aside className="sidebar" aria-label="Primary">
      <Link to="/" className="brand"><LogoMark size={38} /><Wordmark size={30} /></Link>
      <PetSwitcher />
      <nav className="nav">
        {PRIMARY.map(({ to, label, icon: I, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'on' : ''}`} title={label}>
            <span className="nav-ico"><I size={22} strokeWidth={2.1} />{badge === 'dm' && dms > 0 && <span className="nav-badge">{dms}</span>}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
        <div className="nav-sep" />
        {SECONDARY.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link sm ${isActive ? 'on' : ''}`} title={label}>
            <span className="nav-ico"><I size={20} strokeWidth={2.1} /></span><span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="btn btn-primary create-btn" onClick={() => openComposer()}>
        <Sparkles size={18} /><span className="nav-label">Create</span>
      </button>
      <div className="sidebar-foot">
        <Link to="/me" className="owner-chip">
          <img src={me.avatar} alt="" />
          <span className="nav-label grow"><span className="bold small">{me.name}</span><span className="tiny muted" style={{ display: 'block' }}>{me.petIds.length} pets · {me.city}</span></span>
        </Link>
        <div className="row nav-label" style={{ gap: 4 }}>
          <button className="icon-btn sm" onClick={toggleTheme} aria-label="Switch appearance">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="icon-btn sm" onClick={resetDemo} aria-label="Reset sample data" title="Reset sample data"><RotateCcw size={18} /></button>
        </div>
      </div>
    </aside>
  );
}

/** Desktop top bar: search, treats, notifications. */
export function TopBar() {
  const db = useDb();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const n = unreadNotifs(db);
  const [q, setQ] = useState('');
  return (
    <header className="topbar">
      <form className="search topbar-search" onSubmit={(e) => { e.preventDefault(); navigate(`/discover?q=${encodeURIComponent(q)}`); }} role="search">
        <Compass size={18} className="faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pets, breeds, places, #tags…" aria-label="Search" />
        <span className="kbd">↵</span>
      </form>
      <div className="row" style={{ gap: 8 }}>
        <TreatBalance />
        <div className="notif-wrap" ref={ref}>
          <button className="icon-btn bell" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${n ? `, ${n} unread` : ''}`}>
            <Bell size={22} />{n > 0 && <span className="nav-badge">{n}</span>}
          </button>
          {open && (
            <div className="notif-pop">
              <div className="between" style={{ padding: '16px 18px 6px' }}><h3 className="h3">Notifications</h3></div>
              <NotificationList onNavigate={() => setOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Mobile header + slide-in menu for secondary sections. */
export function MobileHeader() {
  const db = useDb();
  const { menuOpen, setMenuOpen, toggleTheme, theme } = useUI();
  const { resetDemo } = useActions();
  const n = unreadNotifs(db);
  const { pathname } = useLocation();
  return (
    <>
      <header className="m-header">
        <Link to="/" className="brand sm"><LogoMark size={30} /><Wordmark size={24} /></Link>
        <div className="row" style={{ gap: 2 }}>
          <TreatBalance />
          <Link to="/notifications" className="icon-btn bell" aria-label="Notifications"><Bell size={22} />{n > 0 && <span className="nav-badge">{n}</span>}</Link>
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menu"><Menu size={22} /></button>
        </div>
      </header>
      {menuOpen && (
        <div className="m-menu-scrim" onClick={() => setMenuOpen(false)}>
          <aside className="m-menu" onClick={(e) => e.stopPropagation()} aria-label="Menu">
            <div className="between"><PetSwitcher /><button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
            <nav className="nav">
              {[...PRIMARY, ...SECONDARY].map(({ to, label, icon: I }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)} className={`nav-link ${pathname === to ? 'on' : ''}`}>
                  <span className="nav-ico"><I size={21} /></span><span className="nav-label">{label}</span>
                </NavLink>
              ))}
              <Link to="/me" className="nav-link" onClick={() => setMenuOpen(false)}><span className="nav-ico"><Users size={21} /></span><span className="nav-label">My pets & account</span></Link>
            </nav>
            <div className="row" style={{ marginTop: 'auto' }}>
              <button className="btn btn-soft btn-sm" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Appearance</button>
              <button className="btn btn-soft btn-sm" onClick={() => { resetDemo(); setMenuOpen(false); }}><RotateCcw size={16} /> Reset</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}><LogOut size={16} /></button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function BottomNav() {
  const active = useActivePet();
  const { openComposer } = useUI();
  const item = (to: string, label: string, I: typeof Home, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => `bn-item ${isActive ? 'on' : ''}`} aria-label={label}>
      <I size={23} strokeWidth={2.1} /><span>{label}</span>
    </NavLink>
  );
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {item('/', 'Home', Home, true)}
      {item('/discover', 'Discover', Compass)}
      <button className="bn-create" onClick={() => openComposer()} aria-label="Create"><Plus size={26} strokeWidth={2.6} /></button>
      {item('/walks', 'Walks', Footprints)}
      <NavLink to={`/pet/${active.handle}`} className={({ isActive }) => `bn-item ${isActive ? 'on' : ''}`} aria-label="Profile">
        <img src={active.avatar} alt="" className="bn-av" /><span>{active.name.split(' ')[0]}</span>
      </NavLink>
    </nav>
  );
}
