import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Check, ChevronRight, EyeOff, MessageCircleHeart, Moon, Plus, RotateCcw, Sun } from 'lucide-react';
import { useActions, useDb, useMe, useUI } from '../store/AppStore';
import { myPets, savedPosts, walksFor, walkTotals } from '../store/selectors';
import { ageLabel, daysUntilBirthday, levelFromXp } from '../utils/format';
import { AddPetWizard } from '../components/profile/AddPetWizard';
import { PostGrid } from '../components/feed/PostGrid';
import { NotificationList } from '../components/layout/Notifications';
import { PostView } from '../components/post/PostModal';
import { useParams } from 'react-router-dom';
import { Empty } from '../components/ui/Kit';

export function MePage() {
  const db = useDb();
  const me = useMe();
  const { setActivePet, resetDemo } = useActions();
  const { theme, toggleTheme, openPetChat } = useUI();
  const [adding, setAdding] = useState(false);
  const pets = myPets(db);
  const saved = savedPosts(db);
  return (
    <div className="page">
      <div className="me-head card">
        <img src={me.avatar} alt="" className="me-av" />
        <div className="grow"><h1 className="h1">{me.name}</h1><p className="muted">@{me.handle} · {me.city}</p><p className="small" style={{ marginTop: 6 }}>{me.bio}</p></div>
        <div className="row wrap">
          <button className="btn btn-soft" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light' : 'Dark'} mode</button>
          <button className="btn btn-ghost" onClick={resetDemo}><RotateCcw size={16} /> Reset sample data</button>
        </div>
      </div>
      <section className="section">
        <div className="section-head"><h2 className="h2">My pets</h2><button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add a pet</button></div>
        <div className="grid-auto">
          {pets.map((p) => {
            const t = walkTotals(walksFor(db, p.id));
            const b = daysUntilBirthday(p.birthday);
            const active = db.activePetId === p.id;
            return (
              <article key={p.id} className={`mypet card ${active ? 'active' : ''}`}>
                <div className="mypet-cover" style={{ backgroundImage: `url(${p.cover})` }} />
                <img src={p.avatar} alt="" className="mypet-av" />
                <div className="card-pad" style={{ paddingTop: 44 }}>
                  <div className="between"><Link to={`/pet/${p.handle}`} className="h3">{p.name}</Link>{active && <span className="pill mint"><Check size={12} /> Active</span>}</div>
                  <p className="small muted">{p.breed} · {ageLabel(p.birthday)} · Level {levelFromXp(p.xp).level}</p>
                  <div className="mypet-stats"><span><b>{p.followers.toLocaleString()}</b> followers</span><span><b>{t.km.toFixed(0)}</b> km</span><span><b>{b.days}</b> days to birthday</span></div>
                  <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                    {!active && <button className="btn btn-dark btn-sm" onClick={() => setActivePet(p.id)}>Act as {p.name}</button>}
                    <button className="btn btn-soft btn-sm" onClick={() => openPetChat(p.id)}><MessageCircleHeart size={14} /> Talk</button>
                    <Link to={`/pet/${p.handle}`} className="btn btn-ghost btn-sm">Profile <ChevronRight size={14} /></Link>
                  </div>
                </div>
              </article>
            );
          })}
          <button className="mypet add card" onClick={() => setAdding(true)}><Plus size={30} /><b>Add another pet</b><span className="tiny muted">Dogs, cats, birds, hedgehogs, fish…</span></button>
        </div>
      </section>
      <section className="section">
        <div className="section-head"><h2 className="h2 row" style={{ gap: 8 }}><Bookmark size={20} /> Saved</h2><span className="muted small">{saved.length} posts</span></div>
        {saved.length ? <PostGrid posts={saved} /> : <Empty icon={<Bookmark size={24} strokeWidth={1.75} />} title="Nothing saved yet" />}
      </section>
      {adding && <AddPetWizard onClose={() => setAdding(false)} />}
    </div>
  );
}

export function NotificationsPage() {
  return <div className="page-narrow"><h1 className="h1" style={{ marginBottom: 16 }}>Notifications</h1><div className="card"><NotificationList /></div></div>;
}

export function PostPage() {
  const { id } = useParams();
  const db = useDb();
  const post = id ? db.posts[id] : undefined;
  if (!post) return <div className="page"><Empty icon={<EyeOff size={24} strokeWidth={1.75} />} title="This post is gone" /></div>;
  return <div className="page"><div className="card" style={{ overflow: 'hidden' }}><PostView post={post} /></div></div>;
}
