import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode,
} from 'react';
import type {
  Aspect, Comment, Conversation, Database, DiaryEntry, ID, LostAlert, MediaItem, Memory, Message, Mood, Pet, PetEvent, Post,
  PostKind, Review, Walk,
} from '../types';
import { api } from '../services/api';
import { applyMutation, type Mutation } from '../services/mutations';
import { storage } from '../services/storage';
import { isToday, uid } from '../utils/format';

// ------------------------------------------------------------------ data
type Action = { type: 'load'; db: Database } | { type: 'mutate'; mutation: Mutation };
const reducer = (s: Database | null, a: Action) => (a.type === 'load' ? a.db : s ? applyMutation(s, a.mutation) : s);

// ------------------------------------------------------------------ UI
export type Theme = 'light' | 'dark';
export interface ToastItem { id: number; text: string; tone?: 'treat' | 'badge' | 'plain'; amount?: number }
export interface ComposerPreset { mode?: 'post' | 'story' | 'clip'; contestId?: ID; media?: MediaItem[]; caption?: string; walkId?: ID }
export interface StoryViewerState { storyIds: ID[]; startIndex: number }

interface UIValue {
  theme: Theme; toggleTheme(): void;
  toasts: ToastItem[]; toast(text: string, opts?: Omit<ToastItem, 'id' | 'text'>): void;
  postModal: ID | null; openPost(id: ID): void; closePost(): void;
  storyViewer: StoryViewerState | null; openStories(s: StoryViewerState): void; closeStories(): void;
  composer: ComposerPreset | null; openComposer(p?: ComposerPreset): void; closeComposer(): void;
  shareTarget: ID | null; setShareTarget(id: ID | null): void;
  chatPetId: ID | null; openPetChat(id: ID | null): void;
  confetti: number; celebrate(): void;
  typing: Record<ID, boolean>;
  menuOpen: boolean; setMenuOpen(o: boolean): void;
}

const DbCtx = createContext<Database | null>(null);
const ActionsCtx = createContext<ReturnType<typeof buildActions> | null>(null);
const UICtx = createContext<UIValue | null>(null);

const BADGE_NAMES: Record<string, string> = {
  trailblazer: 'Trailblazer', 'good-neighbour': 'Good Neighbour', explorer: 'Explorer', 'rescue-hero': 'Rescue Hero', 'birthday-star': 'Birthday Star', 'streak-7': 'Week Streak',
};

function buildActions(get: () => Database | null, commit: (m: Mutation) => void, reload: (d: Database) => void, toast: UIValue['toast'], celebrate: () => void) {
  const db = () => get()!;
  const now = () => new Date().toISOString();
  const active = () => db().activePetId;

  /** Earn (or spend) Treats, with a ledger line, XP for the active pet and a toast. */
  const earn = (amount: number, reason: string, quiet = false) => {
    commit({ type: 'rewards/ledger', entry: { id: uid('lg'), amount, reason, at: now() } });
    if (amount > 0) commit({ type: 'pet/addXp', petId: active(), xp: amount * 2 });
    if (!quiet && amount > 0) toast(reason, { tone: 'treat', amount });
  };
  const award = (petId: ID, badgeId: ID) => {
    if (db().pets[petId]?.badgeIds.includes(badgeId)) return;
    commit({ type: 'pet/awardBadge', petId, badgeId });
    toast(`${db().pets[petId].name} earned “${BADGE_NAMES[badgeId] ?? badgeId}”`, { tone: 'badge' });
    commit({ type: 'notifications/push', notification: { id: uid('n'), type: 'badge', petId, text: `${db().pets[petId].name} earned the “${BADGE_NAMES[badgeId] ?? badgeId}” badge`, createdAt: now(), read: false, href: `/pet/${petId}?tab=badges` } });
  };
  const progress = (challengeId: ID, by: number) => {
    const c = db().challenges.find((x) => x.id === challengeId);
    if (c?.joined && c.progress < c.goal) {
      commit({ type: 'challenge/progress', challengeId, by });
      if (c.progress + by >= c.goal) { earn(c.reward, `Challenge complete: ${c.title}`); celebrate(); }
    }
  };

  return {
    earn,
    // ---- posts
    boop: (postId: ID) => commit({ type: 'post/boop', postId }),
    boopOnly: (postId: ID) => { if (!db().posts[postId]?.boopedByMe) commit({ type: 'post/boop', postId }); },
    giveTreat: (postId: ID) => {
      const p = db().posts[postId];
      if (!p || p.treatedByMe) return;
      if (db().rewards.treats < 1) { toast('You’re out of Treats — go for a walk to earn more!'); return; }
      commit({ type: 'post/treat', postId });
      commit({ type: 'rewards/ledger', entry: { id: uid('lg'), amount: -1, reason: `Gave a treat to ${db().pets[p.petId].name}`, at: now() } });
      toast(`You gave ${db().pets[p.petId].name} a Treat`);
    },
    toggleSave: (postId: ID) => {
      const was = db().posts[postId]?.savedByMe;
      commit({ type: 'post/save', postId });
      toast(was ? 'Removed from Saved' : 'Saved to your collection');
    },
    addComment: (postId: ID, text: string) => {
      const comment: Comment = { id: uid('c'), authorPetId: active(), text: text.trim(), createdAt: now(), likes: 0, likedByMe: false };
      if (!comment.text) return;
      commit({ type: 'comment/add', postId, comment });
      earn(1, 'Comment', true);
    },
    likeComment: (postId: ID, commentId: ID) => commit({ type: 'comment/like', postId, commentId }),
    createPost: (input: { media: MediaItem[]; caption: string; location?: string; aspect: Aspect; kind?: PostKind; walkId?: ID; withPetIds?: ID[]; aiAssisted?: boolean; petId?: ID }) => {
      const post: Post = {
        id: uid('p'), petId: input.petId ?? active(), kind: input.kind ?? 'photo', media: input.media, aspect: input.aspect, caption: input.caption.trim(),
        location: input.location, createdAt: now(), boops: 0, boopedByMe: false, treats: 0, treatedByMe: false, savedByMe: false,
        comments: [], commentCount: 0, walkId: input.walkId, withPetIds: input.withPetIds, aiAssisted: input.aiAssisted,
      };
      commit({ type: 'post/create', post });
      earn(10, 'Shared a new post');
      progress('ch3', 1);
      return post.id;
    },
    deletePost: (postId: ID) => { commit({ type: 'post/delete', postId }); toast('Post deleted'); },
    // ---- pets
    follow: (petId: ID) => commit({ type: 'pet/follow', petId }),
    setActivePet: (petId: ID) => { commit({ type: 'pet/setActive', petId }); toast(`Now acting as ${db().pets[petId].name}`); },
    createPet: (pet: Pet) => { commit({ type: 'pet/create', pet }); earn(50, `Welcome to Snoot, ${pet.name}!`); celebrate(); },
    updatePet: (petId: ID, patch: Partial<Pet>) => { commit({ type: 'pet/update', petId, patch }); toast('Profile saved'); },
    // ---- stories
    markStorySeen: (storyId: ID, upTo: number) => {
      const s = db().stories.find((x) => x.id === storyId);
      if (s && upTo > s.seenUpTo) commit({ type: 'story/seen', storyId, upTo });
    },
    addStory: (media: MediaItem, sticker?: string) => {
      commit({ type: 'story/add', petId: active(), item: { id: uid('si'), media, createdAt: now(), sticker } });
      earn(5, 'Added to your story');
    },
    // ---- walks
    saveWalk: (walk: Walk) => {
      commit({ type: 'walk/save', walk });
      const reward = Math.max(5, Math.round(walk.distanceKm * 12));
      earn(reward, `Walk saved · ${walk.distanceKm.toFixed(2)} km`);
      progress('ch1', walk.distanceKm);
      const count = db().walks.filter((w) => w.petIds.includes(walk.petIds[0])).length;
      if (count >= 10) award(walk.petIds[0], 'trailblazer');
      if (new Date(walk.startedAt).getHours() < 8) award(walk.petIds[0], 'early-riser');
    },
    setWeeklyGoal: (km: number) => commit({ type: 'settings/weeklyGoal', km }),
    // ---- places
    checkIn: (placeId: ID) => {
      const p = db().places.find((x) => x.id === placeId);
      if (!p || p.checkedInToday) return;
      commit({ type: 'place/checkIn', placeId });
      earn(5, `Checked in at ${p.name}`);
      if (p.category === 'park' || p.category === 'trail' || p.category === 'beach') progress('ch2', 1);
      if (db().places.filter((x) => x.checkedInToday).length >= 3) award(active(), 'explorer');
    },
    savePlace: (placeId: ID) => commit({ type: 'place/save', placeId }),
    review: (placeId: ID, rating: number, text: string) => {
      const review: Review = { id: uid('r'), ownerId: db().meId, rating, text, createdAt: now() };
      commit({ type: 'place/review', placeId, review });
      earn(8, 'Thanks for your review');
    },
    redeem: (placeId: ID) => {
      const p = db().places.find((x) => x.id === placeId);
      if (!p?.offer) return null;
      if (db().rewards.treats < p.offer.cost) { toast(`You need ${p.offer.cost - db().rewards.treats} more Treats`); return null; }
      const code = `SNOOT-${p.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      commit({ type: 'rewards/ledger', entry: { id: uid('lg'), amount: -p.offer.cost, reason: `Redeemed: ${p.offer.title}`, at: now() } });
      commit({ type: 'rewards/coupon', coupon: { id: uid('cp'), offerId: p.offer.id, placeId, code, redeemedAt: now() } });
      return code;
    },
    // ---- events & packs
    rsvp: (eventId: ID, rsvp: PetEvent['rsvp']) => {
      const e = db().events.find((x) => x.id === eventId);
      commit({ type: 'event/rsvp', eventId, rsvp, petId: active() });
      if (rsvp === 'going' && e?.rsvp !== 'going') earn(5, `You’re going to ${e?.title}`);
    },
    createEvent: (event: PetEvent) => { commit({ type: 'event/create', event }); earn(20, 'Event published'); award(active(), 'pack-leader'); },
    joinPack: (packId: ID) => {
      const p = db().packs.find((x) => x.id === packId);
      commit({ type: 'pack/join', packId, petId: active() });
      toast(p?.joined ? `Left ${p.name}` : `Joined ${p?.name}`);
    },
    // ---- messages
    openConversation: (petId: ID): ID => {
      const ex = db().conversations.find((c) => c.withPetId === petId);
      if (ex) return ex.id;
      const conversation: Conversation = { id: uid('dm'), withPetId: petId, messages: [], unread: false };
      commit({ type: 'dm/start', conversation });
      return conversation.id;
    },
    sendMessage: (conversationId: ID, text: string, extra: Partial<Pick<Message, 'postId' | 'eventId'>> = {}) => {
      const message: Message = { id: uid('m'), senderPetId: active(), text: text.trim(), createdAt: now(), ...extra };
      if (message.text || extra.postId || extra.eventId) commit({ type: 'dm/send', conversationId, message });
    },
    markConversationRead: (conversationId: ID) => {
      if (db().conversations.find((c) => c.id === conversationId)?.unread) commit({ type: 'dm/read', conversationId });
    },
    readAllNotifications: () => { if (db().notifications.some((n) => !n.read)) commit({ type: 'notifications/readAll' }); },
    // ---- rewards & games
    dailyCheckIn: () => {
      const r = db().rewards;
      if (isToday(r.lastCheckIn)) return 0;
      const yesterday = r.lastCheckIn && Date.now() - new Date(r.lastCheckIn).getTime() < 2 * 86_400_000;
      const streak = yesterday ? r.streak + 1 : 1;
      commit({ type: 'rewards/checkIn', at: now(), streak });
      const amount = 10 + Math.min(streak, 10) * 5;
      earn(amount, `Daily check-in · ${streak}-day streak`);
      if (streak >= 7) award(active(), 'streak-7');
      return amount;
    },
    spin: (prize: number, label: string) => { commit({ type: 'rewards/spin', at: now() }); if (prize > 0) earn(prize, `Spin & Win: ${label}`); celebrate(); },
    joinChallenge: (challengeId: ID) => {
      const c = db().challenges.find((x) => x.id === challengeId);
      commit({ type: 'challenge/join', challengeId });
      toast(c?.joined ? `Left “${c.title}”` : `Joined “${c?.title}” — good luck!`);
    },
    vote: (contestId: ID, entryId: ID) => {
      const c = db().contests.find((x) => x.id === contestId);
      const first = !c?.votedEntryId;
      commit({ type: 'contest/vote', contestId, entryId });
      if (first) earn(2, 'Voted in a contest');
      else toast('Vote moved');
    },
    enterContest: (contestId: ID, postId: ID) => {
      commit({ type: 'contest/enter', contestId, petId: active(), postId });
      toast('Entry submitted');
    },
    // ---- safety & adoption
    reportLost: (alert: LostAlert) => {
      commit({ type: 'lost/report', alert });
      toast('Alert sent to 1,240 neighbours within 2 km');
    },
    sighting: (alertId: ID) => {
      const a = db().lost.find((x) => x.id === alertId);
      if (!a || a.sightedByMe) return;
      commit({ type: 'lost/sighting', alertId });
      earn(15, `Sighting shared for ${a.petName}`);
      award(active(), 'good-neighbour');
    },
    resolveLost: (alertId: ID) => { commit({ type: 'lost/resolve', alertId }); celebrate(); toast('Marked as reunited'); },
    favoriteAdopt: (adoptId: ID) => commit({ type: 'adopt/favorite', adoptId }),
    applyAdopt: (adoptId: ID) => {
      commit({ type: 'adopt/apply', adoptId });
      const a = db().adoption.find((x) => x.id === adoptId);
      toast(`Meet-and-greet request sent to ${a?.shelter}`);
      award(active(), 'rescue-hero');
    },
    // ---- memories
    addMemory: (memory: Omit<Memory, 'id'>) => { commit({ type: 'memory/add', memory: { ...memory, id: uid('mem') } }); earn(5, 'Memory saved'); },
    addDiary: (petId: ID, mood: Mood, text: string, aiWritten = false) => {
      const entry: DiaryEntry = { id: uid('d'), petId, date: now(), mood, text, aiWritten };
      commit({ type: 'diary/add', entry });
      earn(3, 'Diary entry', true);
      toast('Diary entry saved');
    },
    addToAlbum: (albumId: ID, src: string) => { commit({ type: 'album/addMedia', albumId, src }); toast('Added to album'); },
    celebrateBirthday: (petId: ID) => { award(petId, 'birthday-star'); celebrate(); },
    resetDemo: async () => { reload(await api.reset()); toast('Sample data restored'); },
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, dispatch] = useReducer(reducer, null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const [theme, setTheme] = useState<Theme>(() => {
    const s = storage.get<Theme>('snoot.theme');
    if (s === 'light' || s === 'dark') return s;
    const attr = document.documentElement.dataset.theme;
    if (attr === 'light' || attr === 'dark') return attr;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [postModal, setPostModal] = useState<ID | null>(null);
  const [storyViewer, setStoryViewer] = useState<StoryViewerState | null>(null);
  const [composer, setComposer] = useState<ComposerPreset | null>(null);
  const [shareTarget, setShareTarget] = useState<ID | null>(null);
  const [chatPetId, setChatPetId] = useState<ID | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [typing, setTyping] = useState<Record<ID, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.set('snoot.theme', theme);
  }, [theme]);

  const toast = useCallback((text: string, opts: Omit<ToastItem, 'id' | 'text'> = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  const celebrate = useCallback(() => setConfetti((c) => c + 1), []);

  useEffect(() => {
    let alive = true;
    api.bootstrap().then((d) => alive && dispatch({ type: 'load', db: d }));
    const off = api.subscribe((e) => {
      if (e.type === 'mutation') dispatch({ type: 'mutate', mutation: e.mutation });
      if (e.type === 'typing') setTyping((t) => ({ ...t, [e.conversationId]: e.typing }));
    });
    return () => { alive = false; off(); };
  }, []);

  const actions = useMemo(() => {
    const commit = (mutation: Mutation) => {
      dispatch({ type: 'mutate', mutation });
      api.mutate(mutation).catch(async () => {
        toast('Couldn’t save that. Please try again.');
        dispatch({ type: 'load', db: await api.bootstrap() });
      });
    };
    return buildActions(() => dbRef.current, commit, (d) => dispatch({ type: 'load', db: d }), toast, celebrate);
  }, [toast, celebrate]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const openPost = useCallback((id: ID) => setPostModal(id), []);
  const closePost = useCallback(() => setPostModal(null), []);
  const closeStories = useCallback(() => setStoryViewer(null), []);
  const openComposer = useCallback((p: ComposerPreset = {}) => setComposer(p), []);
  const closeComposer = useCallback(() => setComposer(null), []);

  const ui = useMemo<UIValue>(() => ({
    theme, toggleTheme, toasts, toast, postModal, openPost, closePost, storyViewer, openStories: setStoryViewer, closeStories,
    composer, openComposer, closeComposer, shareTarget, setShareTarget, chatPetId, openPetChat: setChatPetId,
    confetti, celebrate, typing, menuOpen, setMenuOpen,
  }), [theme, toggleTheme, toasts, toast, postModal, openPost, closePost, storyViewer, closeStories, composer, openComposer, closeComposer, shareTarget, chatPetId, confetti, celebrate, typing, menuOpen]);

  return (
    <DbCtx.Provider value={db}>
      <ActionsCtx.Provider value={actions}>
        <UICtx.Provider value={ui}>{children}</UICtx.Provider>
      </ActionsCtx.Provider>
    </DbCtx.Provider>
  );
}

export function useDb(): Database {
  const d = useContext(DbCtx);
  if (!d) throw new Error('useDb before load');
  return d;
}
export const useMaybeDb = () => useContext(DbCtx);
export function useActions() {
  const a = useContext(ActionsCtx);
  if (!a) throw new Error('useActions outside provider');
  return a;
}
export function useUI() {
  const u = useContext(UICtx);
  if (!u) throw new Error('useUI outside provider');
  return u;
}
export const useMe = () => { const d = useDb(); return d.owners[d.meId]; };
export const useActivePet = () => { const d = useDb(); return d.pets[d.activePetId]; };
export const useMyPetIds = () => useMe().petIds;
