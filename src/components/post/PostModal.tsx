import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Heart, Link2, MoreHorizontal, Search, X } from 'lucide-react';
import type { Post } from '../../types';
import { useActions, useActivePet, useDb, useUI } from '../../store/AppStore';
import { timeAgo, timeShort } from '../../utils/format';
import { Modal, PetAvatar, PetName, Rich } from '../ui/Kit';
import { PostMedia } from './PostMedia';
import { PostActions, PostMenu } from '../feed/PostCard';

export function PostView({ post }: { post: Post }) {
  const db = useDb();
  const me = useActivePet();
  const { addComment, likeComment } = useActions();
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pet = db.pets[post.petId];
  const submit = () => {
    if (!text.trim()) return;
    addComment(post.id, text);
    setText('');
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
  };
  return (
    <div className="pv">
      <div className="pv-media"><PostMedia post={post} fill /></div>
      <div className="pv-side">
        <header className="post-head" style={{ padding: '18px 18px 12px' }}>
          <PetAvatar pet={pet} size={42} story link />
          <div className="grow"><PetName pet={pet} /><div className="tiny muted">{post.location ?? pet.breed}</div></div>
          <button className="icon-btn sm" onClick={() => setMenu(true)} aria-label="More"><MoreHorizontal size={20} /></button>
        </header>
        <div className="pv-comments" ref={listRef}>
          {post.caption && (
            <div className="cmt">
              <PetAvatar pet={pet} size={34} link />
              <div className="grow"><p className="small"><PetName pet={pet} /> <span className="pre"><Rich text={post.caption} /></span></p><span className="tiny faint">{timeShort(post.createdAt)}</span></div>
            </div>
          )}
          {post.comments.map((c) => {
            const a = db.pets[c.authorPetId];
            if (!a) return null;
            return (
              <div className="cmt" key={c.id}>
                <PetAvatar pet={a} size={34} link />
                <div className="grow">
                  <p className="small"><PetName pet={a} /> <Rich text={c.text} /></p>
                  <div className="row tiny faint" style={{ gap: 12, marginTop: 2 }}>
                    <span>{timeShort(c.createdAt)}</span>{c.likes > 0 && <span>{c.likes} likes</span>}
                    <button className="tiny bold faint" onClick={() => { setText(`@${a.handle} `); inputRef.current?.focus(); }}>Reply</button>
                  </div>
                </div>
                <button className={`cmt-like ${c.likedByMe ? 'on' : ''}`} onClick={() => likeComment(post.id, c.id)} aria-label="Like comment">
                  <Heart size={14} fill={c.likedByMe ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })}
          {post.commentCount > post.comments.length && <p className="tiny faint" style={{ textAlign: 'center' }}>+ {post.commentCount - post.comments.length} earlier comments not loaded in this demo</p>}
          {!post.comments.length && <p className="muted small" style={{ textAlign: 'center', padding: 20 }}>No comments yet — start the conversation</p>}
        </div>
        <div className="pv-foot">
          <PostActions post={post} onComment={() => inputRef.current?.focus()} />
          <p className="tiny faint" style={{ padding: '0 18px 10px' }}>{timeAgo(post.createdAt)}</p>
          <form className="quick-comment boxed" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <img src={me.avatar} alt="" />
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Comment as ${me.name}…`} aria-label="Add a comment" />
            <button className="link small" disabled={!text.trim()}>Post</button>
          </form>
        </div>
      </div>
      {menu && <PostMenu post={post} onClose={() => setMenu(false)} />}
    </div>
  );
}

export function PostModal() {
  const db = useDb();
  const { postModal, closePost } = useUI();
  const post = postModal ? db.posts[postModal] : undefined;
  useEffect(() => { if (postModal && !post) closePost(); }, [postModal, post, closePost]);
  if (!post) return null;
  return (
    <Modal onClose={closePost} size="wide" label="Post" className="post-modal">
      <button className="pv-close icon-btn" onClick={closePost} aria-label="Close"><X size={20} /></button>
      <PostView post={post} />
    </Modal>
  );
}

/** Share a post with friends by DM, or copy its link. */
export function ShareSheet() {
  const db = useDb();
  const { shareTarget, setShareTarget, toast } = useUI();
  const { openConversation, sendMessage } = useActions();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  if (!shareTarget) return null;
  const close = () => { setShareTarget(null); setPicked([]); setQ(''); };
  const people = [...new Set([...db.conversations.map((c) => c.withPetId), ...db.followingPetIds])]
    .map((id) => db.pets[id]).filter((p) => p && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  const send = () => {
    picked.forEach((id) => sendMessage(openConversation(id), '', { postId: shareTarget }));
    toast(`Sent to ${picked.length === 1 ? db.pets[picked[0]].name : `${picked.length} friends`}`);
    close();
  };
  return (
    <Modal onClose={close} label="Share">
      <div className="modal-head"><h2 className="h3">Share with friends</h2><button className="icon-btn sm" onClick={close} aria-label="Close"><X size={20} /></button></div>
      <div className="modal-body">
        <label className="search" style={{ marginBottom: 14 }}><Search size={18} className="faint" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends" /></label>
        <div className="share-grid">
          {people.slice(0, 18).map((p) => (
            <button key={p.id} className={`share-pick ${picked.includes(p.id) ? 'on' : ''}`} onClick={() => setPicked((x) => (x.includes(p.id) ? x.filter((y) => y !== p.id) : [...x, p.id]))}>
              <span className="share-av"><img src={p.avatar} alt="" />{picked.includes(p.id) && <span className="share-check"><Check size={14} strokeWidth={3} /></span>}</span>
              <span className="tiny bold ellipsis">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-soft" onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/post/${shareTarget}`); toast('Link copied'); } catch { toast('Couldn’t copy link'); } }}><Link2 size={16} /> Copy link</button>
          <button className="btn btn-primary grow" disabled={!picked.length} onClick={send}>Send{picked.length ? ` to ${picked.length}` : ''}</button>
        </div>
        <p className="tiny faint" style={{ marginTop: 10 }}>Shared posts arrive in <Link to="/messages" className="link" onClick={close}>Messages</Link>.</p>
      </div>
    </Modal>
  );
}
