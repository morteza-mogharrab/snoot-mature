import type { Database, ID, Pet, Post, Story, Walk } from '../types';
import { daysUntilBirthday } from '../utils/format';

const newest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);
export const isMine = (db: Database, petId: ID) => db.owners[db.meId].petIds.includes(petId);
export const myPets = (db: Database) => db.owners[db.meId].petIds.map((id) => db.pets[id]).filter(Boolean);

export type FeedTab = 'foryou' | 'following' | 'nearby';

/** "For you" blends recency with engagement; "Following" is chronological. */
export function feed(db: Database, tab: FeedTab): Post[] {
  const all = Object.values(db.posts).filter((p) => db.pets[p.petId]);
  const mine = new Set(db.owners[db.meId].petIds);
  if (tab === 'following') {
    const f = new Set([...db.followingPetIds, ...mine]);
    return all.filter((p) => f.has(p.petId)).sort(newest);
  }
  if (tab === 'nearby') {
    const hood = db.owners[db.meId].city;
    return all.filter((p) => db.pets[p.petId].neighbourhood === hood || p.location).sort(newest);
  }
  const score = (p: Post) => {
    const hours = (Date.now() - new Date(p.createdAt).getTime()) / 3_600_000;
    return Math.log10(p.boops + 10) * 10 - hours * 0.35 + (db.followingPetIds.includes(p.petId) ? 6 : 0) + (mine.has(p.petId) ? 8 : 0);
  };
  return all.sort((a, b) => score(b) - score(a));
}

export const postsByPet = (db: Database, petId: ID) =>
  Object.values(db.posts).filter((p) => p.petId === petId || p.withPetIds?.includes(petId)).sort(newest);
export const clips = (db: Database) => Object.values(db.posts).filter((p) => p.kind === 'clip' || p.kind === 'walk')
  .sort((a, b) => Number(b.kind === 'clip') - Number(a.kind === 'clip') || b.createdAt.localeCompare(a.createdAt));
export const savedPosts = (db: Database) => Object.values(db.posts).filter((p) => p.savedByMe).sort(newest);

export const storyOf = (db: Database, petId: ID) => db.stories.find((s) => s.petId === petId && s.items.length > 0);
export const unseen = (s?: Story) => !!s && s.seenUpTo < s.items.length;
export function orderedStories(db: Database): Story[] {
  const mine = new Set(db.owners[db.meId].petIds);
  const others = db.stories.filter((s) => !mine.has(s.petId) && s.items.length);
  return [...db.stories.filter((s) => mine.has(s.petId)), ...others.filter(unseen), ...others.filter((s) => !unseen(s))];
}

export function suggestedPets(db: Database, limit = 5): Pet[] {
  const mine = new Set(db.owners[db.meId].petIds);
  return Object.values(db.pets).filter((p) => !mine.has(p.id) && !db.followingPetIds.includes(p.id)).sort((a, b) => b.followers - a.followers).slice(0, limit);
}

export interface Match { pet: Pet; score: number; reasons: string[] }
/** PawMatch: playdate compatibility from personality dials, species and neighbourhood. */
export function pawMatches(db: Database, forPetId: ID, limit = 8): Match[] {
  const me = db.pets[forPetId];
  const mine = new Set(db.owners[db.meId].petIds);
  return Object.values(db.pets)
    .filter((p) => !mine.has(p.id) && p.species === me.species)
    .map((p) => {
      const d = (k: keyof Pet['stats']) => Math.abs(p.stats[k] - me.stats[k]);
      let score = 100 - (d('energy') * 0.45 + d('social') * 0.3 + d('mischief') * 0.15 + d('cuddles') * 0.1);
      const reasons: string[] = [];
      if (d('energy') < 15) reasons.push('Same energy level');
      if (p.stats.social > 80 && me.stats.social > 80) reasons.push('Both love new friends');
      if (p.neighbourhood === me.neighbourhood) { score += 6; reasons.push(`Both in ${p.neighbourhood}`); }
      if (p.stats.mischief > 80 && me.stats.mischief > 80) reasons.push('Partners in crime');
      if (p.favorites.some((f) => me.favorites.some((g) => g.split(' ')[0].toLowerCase() === f.split(' ')[0].toLowerCase()))) reasons.push('Shared favourite things');
      if (!reasons.length) reasons.push(p.stats.energy > me.stats.energy ? 'Will tire them out' : 'A calm influence');
      return { pet: p, score: Math.max(42, Math.min(99, Math.round(score))), reasons: reasons.slice(0, 2) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const walksFor = (db: Database, petId: ID) => db.walks.filter((w) => w.petIds.includes(petId)).sort((a, b) => b.startedAt.localeCompare(a.startedAt));

/** Last 7 days of distance (km), oldest first, for the bar chart. */
export function weekKm(walks: Walk[]) {
  const days: { label: string; km: number; date: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), km: 0, date: d });
  }
  for (const w of walks) {
    const t = new Date(w.startedAt);
    t.setHours(0, 0, 0, 0);
    const day = days.find((x) => x.date.getTime() === t.getTime());
    if (day) day.km += w.distanceKm;
  }
  return days;
}

export function walkTotals(walks: Walk[]) {
  const km = walks.reduce((s, w) => s + w.distanceKm, 0);
  const sec = walks.reduce((s, w) => s + w.durationSec, 0);
  const longest = walks.reduce((m, w) => Math.max(m, w.distanceKm), 0);
  return { km, sec, count: walks.length, longest, steps: walks.reduce((s, w) => s + w.steps, 0) };
}

/** Weekly leaderboard: seeded numbers for neighbours + real numbers for my pets. */
export function leaderboard(db: Database) {
  const mine = new Set(db.owners[db.meId].petIds);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const rows = Object.values(db.pets).filter((p) => p.species === 'dog').map((p) => {
    const km = mine.has(p.id)
      ? db.walks.filter((w) => w.petIds.includes(p.id) && new Date(w.startedAt).getTime() > weekAgo).reduce((s, w) => s + w.distanceKm, 0)
      : (p.stats.energy / 100) * 22 + ((p.id.length * 7) % 9);
    return { pet: p, km: +km.toFixed(1), mine: mine.has(p.id) };
  });
  return rows.sort((a, b) => b.km - a.km);
}

export function upcomingBirthdays(db: Database, withinDays = 30) {
  const ids = new Set([...db.owners[db.meId].petIds, ...db.followingPetIds]);
  return [...ids].map((id) => db.pets[id]).filter(Boolean)
    .map((p) => ({ pet: p, ...daysUntilBirthday(p.birthday) }))
    .filter((b) => b.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

export const unreadDms = (db: Database) => db.conversations.filter((c) => c.unread).length;
export const unreadNotifs = (db: Database) => db.notifications.filter((n) => !n.read).length;

export function searchAll(db: Database, q: string) {
  const s = q.trim().toLowerCase().replace(/^[@#]/, '');
  if (!s) return { pets: [], places: [], events: [], packs: [], tags: [] as string[] };
  const has = (...f: string[]) => f.some((x) => x.toLowerCase().includes(s));
  const tags = new Set<string>();
  for (const p of Object.values(db.posts)) for (const m of p.caption.matchAll(/#(\w+)/g)) if (m[1].toLowerCase().includes(s)) tags.add(m[1]);
  return {
    pets: Object.values(db.pets).filter((p) => has(p.name, p.handle, p.breed, ...p.traits)).slice(0, 12),
    places: db.places.filter((p) => has(p.name, p.category, ...p.amenities)).slice(0, 6),
    events: db.events.filter((e) => has(e.title, e.category, ...e.tags)).slice(0, 6),
    packs: db.packs.filter((p) => has(p.name, p.tagline, ...p.tags)).slice(0, 6),
    tags: [...tags].slice(0, 8),
  };
}

export function trendingTags(db: Database) {
  const counts = new Map<string, number>();
  for (const p of Object.values(db.posts)) for (const m of p.caption.matchAll(/#(\w+)/g)) counts.set(m[1], (counts.get(m[1]) ?? 0) + p.boops);
  const base = ['autumnvibes', 'zoomies', 'snootoftheday', 'adoptdontshop', 'sleepypets', 'petsofmaplewood', 'walkies', 'firstsnow'];
  base.forEach((t, i) => counts.set(t, (counts.get(t) ?? 0) + 40000 - i * 3000));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, n]) => ({ tag, posts: Math.round(n / 9) }));
}
