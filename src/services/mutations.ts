import type {
  AdoptionPet, AppNotification, Comment, Conversation, Coupon, Database, DiaryEntry, ID, LedgerEntry, LostAlert, Memory, Message,
  Pet, PetEvent, Post, Review, StoryItem, Walk,
} from '../types';

/**
 * Every write the app can make, as a serialisable command. The UI applies it
 * optimistically with `applyMutation`; the API persists the same command.
 * `httpApi.ts` maps each one to a REST endpoint.
 */
export type Mutation =
  | { type: 'post/boop'; postId: ID }
  | { type: 'post/treat'; postId: ID }
  | { type: 'post/save'; postId: ID }
  | { type: 'post/create'; post: Post }
  | { type: 'post/delete'; postId: ID }
  | { type: 'comment/add'; postId: ID; comment: Comment }
  | { type: 'comment/like'; postId: ID; commentId: ID }
  | { type: 'pet/follow'; petId: ID }
  | { type: 'pet/create'; pet: Pet }
  | { type: 'pet/update'; petId: ID; patch: Partial<Pet> }
  | { type: 'pet/setActive'; petId: ID }
  | { type: 'pet/awardBadge'; petId: ID; badgeId: ID }
  | { type: 'pet/addXp'; petId: ID; xp: number }
  | { type: 'story/seen'; storyId: ID; upTo: number }
  | { type: 'story/add'; petId: ID; item: StoryItem }
  | { type: 'walk/save'; walk: Walk }
  | { type: 'place/checkIn'; placeId: ID }
  | { type: 'place/save'; placeId: ID }
  | { type: 'place/review'; placeId: ID; review: Review }
  | { type: 'event/rsvp'; eventId: ID; rsvp: PetEvent['rsvp']; petId: ID }
  | { type: 'event/create'; event: PetEvent }
  | { type: 'pack/join'; packId: ID; petId: ID }
  | { type: 'dm/send'; conversationId: ID; message: Message }
  | { type: 'dm/receive'; conversationId: ID; message: Message }
  | { type: 'dm/start'; conversation: Conversation }
  | { type: 'dm/read'; conversationId: ID }
  | { type: 'notifications/readAll' }
  | { type: 'notifications/push'; notification: AppNotification }
  | { type: 'rewards/ledger'; entry: LedgerEntry }
  | { type: 'rewards/checkIn'; at: string; streak: number }
  | { type: 'rewards/spin'; at: string }
  | { type: 'rewards/coupon'; coupon: Coupon }
  | { type: 'challenge/join'; challengeId: ID }
  | { type: 'challenge/progress'; challengeId: ID; by: number }
  | { type: 'contest/vote'; contestId: ID; entryId: ID }
  | { type: 'contest/enter'; contestId: ID; petId: ID; postId: ID }
  | { type: 'lost/report'; alert: LostAlert }
  | { type: 'lost/sighting'; alertId: ID }
  | { type: 'lost/resolve'; alertId: ID }
  | { type: 'adopt/favorite'; adoptId: ID }
  | { type: 'adopt/apply'; adoptId: ID }
  | { type: 'memory/add'; memory: Memory }
  | { type: 'diary/add'; entry: DiaryEntry }
  | { type: 'album/addMedia'; albumId: ID; src: string }
  | { type: 'settings/weeklyGoal'; km: number };

const mapPost = (db: Database, id: ID, fn: (p: Post) => Post): Database =>
  db.posts[id] ? { ...db, posts: { ...db.posts, [id]: fn(db.posts[id]) } } : db;
const mapPet = (db: Database, id: ID, fn: (p: Pet) => Pet): Database =>
  db.pets[id] ? { ...db, pets: { ...db.pets, [id]: fn(db.pets[id]) } } : db;
const mapList = <K extends keyof Database>(db: Database, key: K, id: ID, fn: (x: never) => unknown): Database => ({
  ...db,
  [key]: (db[key] as unknown as { id: ID }[]).map((x) => (x.id === id ? fn(x as never) : x)),
});
const mapAdopt = (db: Database, id: ID, fn: (a: AdoptionPet) => AdoptionPet) => mapList(db, 'adoption', id, fn as never);

/** Pure reducer shared by the client store and the mock backend. */
export function applyMutation(db: Database, m: Mutation): Database {
  switch (m.type) {
    case 'post/boop':
      return mapPost(db, m.postId, (p) => ({ ...p, boopedByMe: !p.boopedByMe, boops: p.boops + (p.boopedByMe ? -1 : 1) }));
    case 'post/treat':
      return mapPost(db, m.postId, (p) => ({ ...p, treatedByMe: true, treats: p.treats + 1 }));
    case 'post/save':
      return mapPost(db, m.postId, (p) => ({ ...p, savedByMe: !p.savedByMe }));
    case 'post/create':
      return { ...db, posts: { [m.post.id]: m.post, ...db.posts } };
    case 'post/delete': {
      const posts = { ...db.posts };
      delete posts[m.postId];
      return { ...db, posts };
    }
    case 'comment/add':
      return mapPost(db, m.postId, (p) => ({ ...p, comments: [...p.comments, m.comment], commentCount: p.commentCount + 1 }));
    case 'comment/like':
      return mapPost(db, m.postId, (p) => ({
        ...p, comments: p.comments.map((c) => (c.id === m.commentId ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) } : c)),
      }));
    case 'pet/follow': {
      const on = db.followingPetIds.includes(m.petId);
      const next = { ...db, followingPetIds: on ? db.followingPetIds.filter((x) => x !== m.petId) : [...db.followingPetIds, m.petId] };
      return mapPet(next, m.petId, (p) => ({ ...p, followers: p.followers + (on ? -1 : 1) }));
    }
    case 'pet/create': {
      const owner = db.owners[m.pet.ownerId];
      return {
        ...db,
        pets: { ...db.pets, [m.pet.id]: m.pet },
        owners: { ...db.owners, [owner.id]: { ...owner, petIds: [...owner.petIds, m.pet.id] } },
        activePetId: m.pet.id,
      };
    }
    case 'pet/update':
      return mapPet(db, m.petId, (p) => ({ ...p, ...m.patch }));
    case 'pet/setActive':
      return { ...db, activePetId: m.petId };
    case 'pet/awardBadge':
      return mapPet(db, m.petId, (p) => (p.badgeIds.includes(m.badgeId) ? p : { ...p, badgeIds: [...p.badgeIds, m.badgeId] }));
    case 'pet/addXp':
      return mapPet(db, m.petId, (p) => ({ ...p, xp: p.xp + m.xp }));
    case 'story/seen':
      return { ...db, stories: db.stories.map((s) => (s.id === m.storyId ? { ...s, seenUpTo: Math.max(s.seenUpTo, m.upTo) } : s)) };
    case 'story/add': {
      const mine = db.stories.find((s) => s.petId === m.petId);
      if (mine) return { ...db, stories: db.stories.map((s) => (s === mine ? { ...s, items: [...s.items, m.item], seenUpTo: s.items.length + 1 } : s)) };
      return { ...db, stories: [{ id: `s-${m.petId}`, petId: m.petId, items: [m.item], seenUpTo: 1 }, ...db.stories] };
    }
    case 'walk/save':
      return { ...db, walks: [m.walk, ...db.walks] };
    case 'place/checkIn':
      return mapList(db, 'places', m.placeId, ((p: Database['places'][number]) => ({ ...p, checkedInToday: true, checkIns: p.checkIns + 1 })) as never);
    case 'place/save':
      return mapList(db, 'places', m.placeId, ((p: Database['places'][number]) => ({ ...p, saved: !p.saved })) as never);
    case 'place/review':
      return mapList(db, 'places', m.placeId, ((p: Database['places'][number]) => ({
        ...p, reviews: [m.review, ...p.reviews], reviewCount: p.reviewCount + 1,
        rating: +((p.rating * p.reviewCount + m.review.rating) / (p.reviewCount + 1)).toFixed(1),
      })) as never);
    case 'event/rsvp':
      return mapList(db, 'events', m.eventId, ((e: PetEvent) => {
        const dec = { going: e.rsvp === 'going' ? 1 : 0, interested: e.rsvp === 'interested' ? 1 : 0 };
        const inc = { going: m.rsvp === 'going' ? 1 : 0, interested: m.rsvp === 'interested' ? 1 : 0 };
        const attendees = e.attendeePetIds.filter((x) => x !== m.petId);
        return {
          ...e, rsvp: m.rsvp, going: e.going - dec.going + inc.going, interested: e.interested - dec.interested + inc.interested,
          attendeePetIds: m.rsvp === 'going' ? [m.petId, ...attendees] : attendees,
        };
      }) as never);
    case 'event/create':
      return { ...db, events: [m.event, ...db.events] };
    case 'pack/join':
      return mapList(db, 'packs', m.packId, ((p: Database['packs'][number]) => ({
        ...p, joined: !p.joined, members: p.members + (p.joined ? -1 : 1),
        memberPetIds: p.joined ? p.memberPetIds.filter((x) => x !== m.petId) : [m.petId, ...p.memberPetIds],
      })) as never);
    case 'dm/send':
    case 'dm/receive': {
      const conv = db.conversations.find((c) => c.id === m.conversationId);
      if (!conv) return db;
      const updated = { ...conv, messages: [...conv.messages, m.message], unread: m.type === 'dm/receive' };
      return { ...db, conversations: [updated, ...db.conversations.filter((c) => c !== conv)] };
    }
    case 'dm/start':
      return db.conversations.some((c) => c.id === m.conversation.id) ? db : { ...db, conversations: [m.conversation, ...db.conversations] };
    case 'dm/read':
      return { ...db, conversations: db.conversations.map((c) => (c.id === m.conversationId ? { ...c, unread: false } : c)) };
    case 'notifications/readAll':
      return { ...db, notifications: db.notifications.map((n) => (n.read ? n : { ...n, read: true })) };
    case 'notifications/push':
      return { ...db, notifications: [m.notification, ...db.notifications] };
    case 'rewards/ledger':
      return { ...db, rewards: { ...db.rewards, treats: Math.max(0, db.rewards.treats + m.entry.amount), ledger: [m.entry, ...db.rewards.ledger].slice(0, 60) } };
    case 'rewards/checkIn':
      return { ...db, rewards: { ...db.rewards, lastCheckIn: m.at, streak: m.streak } };
    case 'rewards/spin':
      return { ...db, rewards: { ...db.rewards, lastSpin: m.at } };
    case 'rewards/coupon':
      return { ...db, rewards: { ...db.rewards, coupons: [m.coupon, ...db.rewards.coupons] } };
    case 'challenge/join':
      return mapList(db, 'challenges', m.challengeId, ((c: Database['challenges'][number]) => ({ ...c, joined: !c.joined, participants: c.participants + (c.joined ? -1 : 1) })) as never);
    case 'challenge/progress':
      return mapList(db, 'challenges', m.challengeId, ((c: Database['challenges'][number]) => ({ ...c, progress: +Math.min(c.goal, c.progress + m.by).toFixed(1) })) as never);
    case 'contest/vote':
      return mapList(db, 'contests', m.contestId, ((c: Database['contests'][number]) => ({
        ...c, votedEntryId: m.entryId,
        entries: c.entries.map((e) => ({ ...e, votes: e.votes + (e.id === m.entryId ? 1 : 0) - (e.id === c.votedEntryId ? 1 : 0) })),
      })) as never);
    case 'contest/enter': {
      const post = db.posts[m.postId];
      if (!post) return db;
      return mapList(db, 'contests', m.contestId, ((c: Database['contests'][number]) => ({
        ...c, enteredPetId: m.petId,
        entries: [...c.entries.filter((e) => e.petId !== m.petId), { id: `ce-${m.postId}`, petId: m.petId, media: post.media[0], votes: 1 }],
      })) as never);
    }
    case 'lost/report':
      return { ...db, lost: [m.alert, ...db.lost] };
    case 'lost/sighting':
      return mapList(db, 'lost', m.alertId, ((a: LostAlert) => ({ ...a, sightings: a.sightings + 1, sightedByMe: true })) as never);
    case 'lost/resolve':
      return mapList(db, 'lost', m.alertId, ((a: LostAlert) => ({ ...a, status: 'found' })) as never);
    case 'adopt/favorite':
      return mapAdopt(db, m.adoptId, (a) => ({ ...a, favorite: !a.favorite }));
    case 'adopt/apply':
      return mapAdopt(db, m.adoptId, (a) => ({ ...a, applied: true }));
    case 'memory/add':
      return { ...db, memories: [m.memory, ...db.memories] };
    case 'diary/add':
      return { ...db, diary: [m.entry, ...db.diary] };
    case 'album/addMedia':
      return { ...db, albums: db.albums.map((a) => (a.id === m.albumId ? { ...a, media: [{ src: m.src, thumb: m.src }, ...a.media], updatedAt: new Date().toISOString() } : a)) };
    case 'settings/weeklyGoal':
      return { ...db, weeklyGoalKm: m.km };
    default:
      return db;
  }
}
