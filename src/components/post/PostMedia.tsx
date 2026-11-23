import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Footprints, Play } from 'lucide-react';
import type { Post } from '../../types';
import { useActions, useDb } from '../../store/AppStore';
import { useDoubleTap } from '../../hooks';
import { durationWords } from '../../utils/format';
import { BoopIcon } from '../ui/Brand';
import { MiniRoute } from '../map/MiniRoute';

/** Post media: carousel, double-tap boop with a nose burst, walk/milestone overlays. */
export function PostMedia({ post, fill = false, onTap }: { post: Post; fill?: boolean; onTap?(): void }) {
  const db = useDb();
  const { boopOnly } = useActions();
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);
  const tap = useDoubleTap(() => { boopOnly(post.id); setBurst((b) => b + 1); }, onTap);
  const walk = post.walkId ? db.walks.find((w) => w.id === post.walkId) : undefined;
  const n = post.media.length;

  return (
    <div className={`pm ${fill ? 'fill' : ''}`} style={fill ? undefined : { aspectRatio: post.aspect === '4:5' ? '4 / 5' : '1 / 1' }}>
      <div className="pm-track" style={{ transform: `translateX(-${i * 100}%)` }} onClick={tap}>
        {post.media.map((m, k) => (
          <div className="pm-slide" key={k}><img src={m.src} alt={m.alt || `${db.pets[post.petId]?.name}'s photo`} loading={k ? 'lazy' : 'eager'} draggable={false} /></div>
        ))}
      </div>
      {burst > 0 && <span key={burst} className="boop-burst" aria-hidden="true"><BoopIcon size={92} filled /></span>}
      {post.kind === 'clip' && <span className="pm-kind"><Play size={13} fill="currentColor" /> Clip</span>}
      {post.milestone && (
        <span className="pm-milestone"><span>{post.milestone.emoji}</span>{post.milestone.title}</span>
      )}
      {walk && (
        <div className="pm-walk">
          <MiniRoute route={walk.route} size={64} />
          <div className="pm-walk-stats">
            <span className="pm-walk-km">{walk.distanceKm.toFixed(1)}<small> km</small></span>
            <span className="row tiny" style={{ gap: 10 }}><span className="row" style={{ gap: 4 }}><Clock size={12} />{durationWords(walk.durationSec)}</span><span className="row" style={{ gap: 4 }}><Footprints size={12} />{walk.steps.toLocaleString()}</span></span>
          </div>
        </div>
      )}
      {i > 0 && <button className="pm-nav prev" onClick={() => setI(i - 1)} aria-label="Previous photo"><ChevronLeft size={18} /></button>}
      {i < n - 1 && <button className="pm-nav next" onClick={() => setI(i + 1)} aria-label="Next photo"><ChevronRight size={18} /></button>}
      {n > 1 && <div className="pm-dots" aria-hidden="true">{post.media.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>}
    </div>
  );
}
