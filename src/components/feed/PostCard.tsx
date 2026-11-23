import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Link2, MapPin, MessageCircle, MoreHorizontal, Send, Sparkles, Trash2, UserMinus, Flag, Music2 } from 'lucide-react';
import type { Post } from '../../types';
import { useActions, useActivePet, useDb, useUI } from '../../store/AppStore';
import { isMine } from '../../store/selectors';
import { compact, timeShort } from '../../utils/format';
import { BoopIcon, TreatIcon } from '../ui/Brand';
import { ActionSheet, PetAvatar, PetName, Rich } from '../ui/Kit';
import { PostMedia } from '../post/PostMedia';

export function PostActions({ post, onComment }: { post: Post; onComment(): void }) {
  const { boop, giveTreat, toggleSave } = useActions();
  const { setShareTarget } = useUI();
  return (
    <div className="pa">
      <button className={`pa-btn boop ${post.boopedByMe ? 'on' : ''}`} onClick={() => boop(post.id)} aria-pressed={post.boopedByMe} aria-label="Boop">
        <BoopIcon size={24} filled={post.boopedByMe} key={String(post.boopedByMe)} /><span>{compact(post.boops)}</span>
      </button>
      <button className="pa-btn" onClick={onComment} aria-label="Comments"><MessageCircle size={23} /><span>{compact(post.commentCount)}</span></button>
      <button className={`pa-btn treat ${post.treatedByMe ? 'on' : ''}`} onClick={() => giveTreat(post.id)} aria-label="Give a treat" title="Give a treat (costs 1 Treat)">
        <TreatIcon size={22} className={post.treatedByMe ? 'treat-given' : 'treat-ico'} /><span>{compact(post.treats)}</span>
      </button>
      <button className="pa-btn" onClick={() => setShareTarget(post.id)} aria-label="Share"><Send size={22} /></button>
      <button className={`pa-btn save ${post.savedByMe ? 'on' : ''}`} onClick={() => toggleSave(post.id)} aria-label="Save" aria-pressed={post.savedByMe}>
        <Bookmark size={22} fill={post.savedByMe ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

export function PostMenu({ post, onClose }: { post: Post; onClose(): void }) {
  const db = useDb();
  const { deletePost, follow } = useActions();
  const { toast, closePost } = useUI();
  const mine = isMine(db, post.petId);
  const pet = db.pets[post.petId];
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/post/${post.id}`); toast('Link copied'); } catch { toast('Couldn’t copy link'); }
  };
  return (
    <ActionSheet onClose={onClose} items={mine ? [
      { label: 'Delete post', icon: <Trash2 size={18} />, danger: true, onClick: () => { closePost(); deletePost(post.id); } },
      { label: 'Copy link', icon: <Link2 size={18} />, onClick: copy },
    ] : [
      ...(db.followingPetIds.includes(pet.id) ? [{ label: `Unfollow ${pet.name}`, icon: <UserMinus size={18} />, danger: true, onClick: () => follow(pet.id) }] : []),
      { label: 'Copy link', icon: <Link2 size={18} />, onClick: copy },
      { label: 'Report', icon: <Flag size={18} />, onClick: () => toast('Thanks — our team will take a look') },
    ]} />
  );
}

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const db = useDb();
  const me = useActivePet();
  const { openPost } = useUI();
  const { addComment, follow } = useActions();
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState(false);
  const [text, setText] = useState('');
  const pet = db.pets[post.petId];
  if (!pet) return null;
  const long = post.caption.length > 150;
  const caption = more || !long ? post.caption : `${post.caption.slice(0, 140).trimEnd()}…`;
  const preview = post.comments.slice(-2);
  const followed = db.followingPetIds.includes(pet.id) || isMine(db, pet.id);
  const withPets = (post.withPetIds ?? []).map((id) => db.pets[id]).filter(Boolean);

  return (
    <article className="post card">
      <header className="post-head">
        <PetAvatar pet={pet} size={44} story link />
        <div className="grow" style={{ lineHeight: 1.25 }}>
          <div className="row" style={{ gap: 6 }}>
            <PetName pet={pet} />
            {withPets.length > 0 && <span className="muted small">with {withPets.map((w, i) => <span key={w.id}>{i ? ', ' : ''}<Link to={`/pet/${w.handle}`} className="bold">{w.name}</Link></span>)}</span>}
          </div>
          <div className="tiny muted row" style={{ gap: 6 }}>
            <span>{pet.breed}</span><span className="dot" style={{ width: 3, height: 3 }} /><time dateTime={post.createdAt}>{timeShort(post.createdAt)}</time>
            {post.location && <><span className="dot" style={{ width: 3, height: 3 }} /><span className="row" style={{ gap: 3 }}><MapPin size={11} />{post.location}</span></>}
          </div>
        </div>
        {!followed && <button className="btn btn-soft btn-sm" onClick={() => follow(pet.id)}>Follow</button>}
        <button className="icon-btn sm" onClick={() => setMenu(true)} aria-label="More"><MoreHorizontal size={20} /></button>
      </header>
      <div className="post-media-wrap"><PostMedia post={post} onTap={() => openPost(post.id)} /></div>
      <PostActions post={post} onComment={() => openPost(post.id)} />
      <div className="post-body">
        {post.caption && (
          <p className="post-caption">
            <Rich text={caption} />
            {long && !more && <button className="link small" onClick={() => setMore(true)} style={{ marginLeft: 4 }}>more</button>}
          </p>
        )}
        <div className="row wrap" style={{ gap: 6 }}>
          {post.aiAssisted && <span className="pill lilac"><Sparkles size={12} /> Written with Snoot AI</span>}
          {post.audio && <span className="pill"><Music2 size={12} /> {post.audio}</span>}
        </div>
        {post.commentCount > preview.length && (
          <button className="muted small" style={{ textAlign: 'left' }} onClick={() => openPost(post.id)}>View all {post.commentCount} comments</button>
        )}
        {preview.map((c) => db.pets[c.authorPetId] && (
          <p key={c.id} className="small"><Link to={`/pet/${c.authorPetId}`} className="bold">{db.pets[c.authorPetId].name}</Link> <Rich text={c.text} /></p>
        ))}
        <form className="quick-comment" onSubmit={(e) => { e.preventDefault(); addComment(post.id, text); setText(''); }}>
          <img src={me.avatar} alt="" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Comment as ${me.name}…`} aria-label="Add a comment" />
          {text.trim() && <button className="link small">Post</button>}
        </form>
      </div>
      {menu && <PostMenu post={post} onClose={() => setMenu(false)} />}
    </article>
  );
});
