import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CalendarHeart, Gift, HeartHandshake, MessageCircle, Siren, Trophy, UserPlus } from 'lucide-react';
import type { AppNotification } from '../../types';
import { useActions, useDb, useUI } from '../../store/AppStore';
import { timeShort } from '../../utils/format';
import { BoopIcon, TreatIcon } from '../ui/Brand';

const ICON: Record<AppNotification['type'], { el: React.ReactNode; tone: string }> = {
  boop: { el: <BoopIcon size={14} filled />, tone: 'coral' },
  treat: { el: <TreatIcon size={14} />, tone: 'honey' },
  comment: { el: <MessageCircle size={13} />, tone: 'sky' },
  follow: { el: <UserPlus size={13} />, tone: 'lilac' },
  event: { el: <CalendarHeart size={13} />, tone: 'mint' },
  badge: { el: <Award size={13} />, tone: 'lilac' },
  lost: { el: <Siren size={13} />, tone: 'coral' },
  birthday: { el: <Gift size={13} />, tone: 'pink' },
  playdate: { el: <HeartHandshake size={13} />, tone: 'mint' },
  contest: { el: <Trophy size={13} />, tone: 'honey' },
};

export function NotificationList({ onNavigate }: { onNavigate?(): void }) {
  const db = useDb();
  const navigate = useNavigate();
  const { readAllNotifications } = useActions();
  const { openPost } = useUI();
  useEffect(() => {
    const t = setTimeout(readAllNotifications, 1800);
    return () => clearTimeout(t);
  }, [readAllNotifications]);

  const go = (n: AppNotification) => {
    onNavigate?.();
    if (n.postId && db.posts[n.postId]) openPost(n.postId);
    else if (n.href) navigate(n.href);
    else if (n.petId) navigate(`/pet/${n.petId}`);
  };

  return (
    <ul className="notif-list">
      {db.notifications.map((n) => {
        const pet = n.petId ? db.pets[n.petId] : undefined;
        const post = n.postId ? db.posts[n.postId] : undefined;
        const i = ICON[n.type];
        return (
          <li key={n.id}>
            <button className={`notif ${n.read ? '' : 'unread'}`} onClick={() => go(n)}>
              <span className="notif-av">
                {pet ? <img src={pet.avatar} alt="" /> : <span className="notif-sys">{i.el}</span>}
                <span className={`notif-badge t-${i.tone}`}>{i.el}</span>
              </span>
              <span className="notif-text">
                {pet && n.type !== 'badge' && n.type !== 'birthday' && n.type !== 'contest' && <b>{pet.name} </b>}{n.text}
                <span className="faint"> · {timeShort(n.createdAt)}</span>
              </span>
              {post && <img className="notif-thumb" src={post.media[0].thumb ?? post.media[0].src} alt="" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
