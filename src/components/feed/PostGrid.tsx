import { Clapperboard, Copy, Footprints, MessageCircle } from 'lucide-react';
import type { Post } from '../../types';
import { useUI } from '../../store/AppStore';
import { compact } from '../../utils/format';
import { BoopIcon } from '../ui/Brand';

export function PostGrid({ posts, tall = false }: { posts: Post[]; tall?: boolean }) {
  const { openPost } = useUI();
  return (
    <div className={`pgrid ${tall ? 'tall' : ''}`}>
      {posts.map((p) => (
        <button key={p.id} className="pgrid-tile" onClick={() => openPost(p.id)} aria-label={p.caption.slice(0, 60)}>
          <img src={p.media[0].thumb ?? p.media[0].src} alt="" loading="lazy" />
          <span className="pgrid-badge">
            {p.kind === 'clip' ? <Clapperboard size={16} /> : p.kind === 'walk' ? <Footprints size={16} /> : p.media.length > 1 ? <Copy size={16} /> : null}
          </span>
          {p.milestone && <span className="pgrid-ms">{p.milestone.emoji}</span>}
          <span className="pgrid-hover"><span><BoopIcon size={18} filled /> {compact(p.boops)}</span><span><MessageCircle size={18} fill="currentColor" /> {compact(p.commentCount)}</span></span>
        </button>
      ))}
    </div>
  );
}
