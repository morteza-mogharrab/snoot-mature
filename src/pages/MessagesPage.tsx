import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarHeart, Image as ImageIcon, MessageCircle, PenSquare, Search, Send, Smile } from 'lucide-react';
import { useActions, useDb, useUI } from '../store/AppStore';
import { useIsMobile } from '../hooks';
import { fmtDay, fmtTime, timeShort } from '../utils/format';
import { Modal, ModalHead } from '../components/ui/Kit';

const EMOJI = ['🐾', '🦴', '😂', '🥹', '❤️', '🎾', '🐶', '🐱', '⚡️', '👃'];

function NewChat({ onClose }: { onClose(): void }) {
  const db = useDb();
  const navigate = useNavigate();
  const { openConversation } = useActions();
  const [q, setQ] = useState('');
  const pets = Object.values(db.pets).filter((p) => !db.owners[db.meId].petIds.includes(p.id) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <Modal onClose={onClose} label="New message">
      <ModalHead title="New message" onClose={onClose} />
      <div className="modal-body">
        <label className="search" style={{ marginBottom: 10 }}><Search size={18} className="faint" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pets" /></label>
        <div className="col" style={{ gap: 2, maxHeight: 380, overflow: 'auto' }}>
          {pets.map((p) => (
            <button key={p.id} className="list-row plain" onClick={() => { onClose(); navigate(`/messages/${openConversation(p.id)}`); }}>
              <img src={p.avatar} alt="" className="list-av" /><span className="grow" style={{ textAlign: 'left' }}><b>{p.name}</b><span className="tiny muted" style={{ display: 'block' }}>{p.breed} · {db.owners[p.ownerId].name}</span></span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function MessagesPage() {
  const db = useDb();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const { typing, openPost } = useUI();
  const { sendMessage, markConversationRead } = useActions();
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const [newChat, setNewChat] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const conv = db.conversations.find((c) => c.id === id);
  const mine = new Set(db.owners[db.meId].petIds);
  useEffect(() => { if (conv) markConversationRead(conv.id); }, [conv?.id, conv?.messages.length, markConversationRead]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [conv?.messages.length, id, typing[id ?? '']]); // eslint-disable-line react-hooks/exhaustive-deps

  const inbox = (
    <aside className="inbox">
      <div className="between" style={{ padding: '22px 20px 10px' }}><h1 className="h2">Messages</h1><button className="icon-btn" onClick={() => setNewChat(true)} aria-label="New message"><PenSquare size={20} /></button></div>
      <div className="inbox-list">
        {db.conversations.map((c) => {
          const p = db.pets[c.withPetId];
          const last = c.messages[c.messages.length - 1];
          return (
            <Link key={c.id} to={`/messages/${c.id}`} className={`inbox-row ${c.id === id ? 'on' : ''} ${c.unread ? 'unread' : ''}`}>
              <img src={p.avatar} alt="" />
              <span className="grow" style={{ lineHeight: 1.35 }}>
                <b>{p.name}</b>
                <span className="tiny muted ellipsis" style={{ display: 'block' }}>
                  {typing[c.id] ? <em>typing…</em> : last ? `${mine.has(last.senderPetId) ? 'You: ' : ''}${last.text || (last.postId ? 'Shared a post' : last.eventId ? 'Shared an event' : '')}` : 'Say hi 👋'}
                </span>
              </span>
              <span className="col" style={{ alignItems: 'flex-end', gap: 6 }}>{last && <span className="tiny faint">{timeShort(last.createdAt)}</span>}{c.unread && <span className="unread-dot" />}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );

  return (
    <div className={`messages ${conv ? 'has' : ''}`}>
      {(!isMobile || !conv) && inbox}
      {conv ? (() => {
        const p = db.pets[conv.withPetId];
        return (
          <section className="thread">
            <header className="thread-head">
              {isMobile && <Link to="/messages" className="icon-btn" aria-label="Back"><ArrowLeft size={20} /></Link>}
              <Link to={`/pet/${p.handle}`} className="row grow" style={{ gap: 12 }}>
                <img src={p.avatar} alt="" className="thread-av" />
                <span style={{ lineHeight: 1.3 }}><b>{p.name}</b><span className="tiny muted" style={{ display: 'block' }}>{typing[conv.id] ? 'typing…' : `${p.breed} · ${db.owners[p.ownerId].name}`}</span></span>
              </Link>
            </header>
            <div className="thread-body">
              <div className="thread-intro"><img src={p.avatar} alt="" /><b className="h3">{p.name}</b><span className="tiny muted">You and {p.name} are both in {p.neighbourhood}</span></div>
              {conv.messages.map((m, i) => {
                const me = mine.has(m.senderPetId);
                const prev = conv.messages[i - 1];
                const stamp = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 3600_000;
                const post = m.postId ? db.posts[m.postId] : undefined;
                const ev = m.eventId ? db.events.find((e) => e.id === m.eventId) : undefined;
                const sender = db.pets[m.senderPetId];
                return (
                  <Fragment key={m.id}>
                    {stamp && <div className="thread-stamp">{fmtDay(m.createdAt)} · {fmtTime(m.createdAt)}</div>}
                    <div className={`msg ${me ? 'me' : ''}`}>
                      {me && mine.size > 1 && <img src={sender?.avatar} alt={sender?.name} className="msg-as" title={`as ${sender?.name}`} />}
                      <div className="col" style={{ gap: 4, alignItems: me ? 'flex-end' : 'flex-start' }}>
                        {post && <button className="msg-post" onClick={() => openPost(post.id)}><img src={post.media[0].thumb ?? post.media[0].src} alt="" /><span className="tiny"><b>{db.pets[post.petId].name}</b> {post.caption.slice(0, 60)}…</span></button>}
                        {ev && <Link to={`/events/${ev.id}`} className="msg-post ev"><CalendarHeart size={18} /><span className="tiny"><b>{ev.title}</b><br />{fmtDay(ev.start)}</span></Link>}
                        {m.text && <div className="bubble">{m.text}</div>}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {typing[conv.id] && <div className="msg"><div className="bubble typing"><i /><i /><i /></div></div>}
              <div ref={end} />
            </div>
            <form className="thread-input" onSubmit={(e) => { e.preventDefault(); sendMessage(conv.id, text); setText(''); }}>
              <div style={{ position: 'relative' }}>
                <button type="button" className="icon-btn sm" onClick={() => setEmoji((x) => !x)} aria-label="Emoji"><Smile size={20} /></button>
                {emoji && <div className="emoji-pop">{EMOJI.map((x) => <button type="button" key={x} onClick={() => { setText((t) => t + x); setEmoji(false); }}>{x}</button>)}</div>}
              </div>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${p.name}…`} aria-label="Message" />
              <button type="button" className="icon-btn sm" aria-label="Photo" onClick={() => sendMessage(conv.id, '🐾📸')}><ImageIcon size={20} /></button>
              <button className="send-btn" disabled={!text.trim()} aria-label="Send"><Send size={18} /></button>
            </form>
          </section>
        );
      })() : !isMobile && (
        <section className="thread empty-thread">
          <span className="empty-art"><MessageCircle size={24} strokeWidth={1.75} /></span>
          <h2 className="h2">Your messages</h2>
          <p className="muted">Plan playdates, share walks and send boops.</p>
          <button className="btn btn-primary" onClick={() => setNewChat(true)}>New message</button>
        </section>
      )}
      {newChat && <NewChat onClose={() => setNewChat(false)} />}
    </div>
  );
}
