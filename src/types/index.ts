/**
 * Snoot domain model. The mock API returns exactly these shapes, so a real
 * backend only needs to serve the same JSON (see src/services/api.ts).
 */
export type ID = string;
export type ISODate = string;
export type Aspect = '1:1' | '4:5';

export interface MediaItem { src: string; thumb?: string; alt?: string }

export type Species = 'dog' | 'cat' | 'bird' | 'small' | 'fish';

/** 0–100 personality dials used by the Pet Card, PawMatch and the AI. */
export interface PetStats { energy: number; cuddles: number; mischief: number; appetite: number; social: number }

export interface Personality {
  archetype: string;
  summary: string;
  quirks: string[];
  voice: 'dramatic' | 'wholesome' | 'sassy' | 'zen' | 'chaotic';
}

export interface Owner {
  id: ID;
  name: string;
  handle: string;
  avatar: string;
  city: string;
  bio: string;
  petIds: ID[];
}

export interface Pet {
  id: ID;
  handle: string;
  name: string;
  species: Species;
  breed: string;
  sex: 'boy' | 'girl';
  birthday: ISODate;
  gotchaDay?: ISODate;
  avatar: string;
  cover: string;
  bio: string;
  traits: string[];
  favorites: string[];
  stats: PetStats;
  personality: Personality;
  ownerId: ID;
  followers: number;
  following: number;
  badgeIds: ID[];
  neighbourhood: string;
  verified?: boolean;
  /** Snoot "level": grows with activity. */
  xp: number;
}

export interface Comment {
  id: ID; authorPetId: ID; text: string; createdAt: ISODate; likes: number; likedByMe: boolean;
}

export type PostKind = 'photo' | 'clip' | 'walk' | 'milestone';

export interface Post {
  id: ID;
  petId: ID;
  kind: PostKind;
  media: MediaItem[];
  aspect: Aspect;
  caption: string;
  location?: string;
  createdAt: ISODate;
  boops: number;
  boopedByMe: boolean;
  treats: number;
  treatedByMe: boolean;
  savedByMe: boolean;
  comments: Comment[];
  commentCount: number;
  /** Other pets in the photo (collabs show on both profiles). */
  withPetIds?: ID[];
  walkId?: ID;
  milestone?: { emoji: string; title: string };
  audio?: string;
  packId?: ID;
  aiAssisted?: boolean;
}

export interface StoryItem { id: ID; media: MediaItem; createdAt: ISODate; sticker?: string }
export interface Story { id: ID; petId: ID; items: StoryItem[]; seenUpTo: number }

export type Point = [number, number];

export interface Walk {
  id: ID;
  petIds: ID[];
  startedAt: ISODate;
  durationSec: number;
  distanceKm: number;
  steps: number;
  route: Point[];
  mood: 'zoomies' | 'sniffy' | 'chill' | 'stubborn';
  note?: string;
  placeIds?: ID[];
}

export type PlaceCategory = 'park' | 'vet' | 'store' | 'groomer' | 'cafe' | 'trail' | 'beach' | 'trainer';

export interface Offer { id: ID; title: string; detail: string; cost: number }

export interface Review { id: ID; ownerId: ID; rating: number; text: string; createdAt: ISODate }

export interface Place {
  id: ID;
  name: string;
  category: PlaceCategory;
  /** Position on the 1000×700 neighbourhood map. */
  x: number;
  y: number;
  address: string;
  rating: number;
  reviewCount: number;
  hours: string;
  openNow: boolean;
  priceLevel?: 1 | 2 | 3;
  amenities: string[];
  photo?: MediaItem;
  description: string;
  offer?: Offer;
  partner?: boolean;
  checkIns: number;
  checkedInToday: boolean;
  saved: boolean;
  reviews: Review[];
  phone?: string;
}

export type EventCategory = 'meetup' | 'adoption' | 'competition' | 'training' | 'show' | 'party';

export interface PetEvent {
  id: ID;
  title: string;
  category: EventCategory;
  start: ISODate;
  end: ISODate;
  placeId: ID;
  cover: MediaItem;
  host: string;
  hostPetId?: ID;
  packId?: ID;
  description: string;
  going: number;
  interested: number;
  rsvp: 'going' | 'interested' | null;
  price: number;
  tags: string[];
  attendeePetIds: ID[];
  capacity?: number;
  species?: Species[];
}

export interface Pack {
  id: ID;
  name: string;
  tagline: string;
  description: string;
  cover: MediaItem;
  icon: string;
  color: string;
  members: number;
  joined: boolean;
  tags: string[];
  memberPetIds: ID[];
  rules: string[];
}

export interface Message {
  id: ID; senderPetId: ID; text: string; createdAt: ISODate; postId?: ID; eventId?: ID; likedByMe?: boolean;
}
export interface Conversation { id: ID; withPetId: ID; messages: Message[]; unread: boolean }

export type NotificationType =
  | 'boop' | 'comment' | 'follow' | 'treat' | 'event' | 'badge' | 'lost' | 'birthday' | 'playdate' | 'contest';

export interface AppNotification {
  id: ID; type: NotificationType; petId?: ID; postId?: ID; text: string; createdAt: ISODate; read: boolean; href?: string;
}

export type MemoryType = 'milestone' | 'first' | 'adventure' | 'health' | 'photo' | 'birthday';

export interface Memory {
  id: ID; petId: ID; date: ISODate; type: MemoryType; title: string; note: string; emoji: string; media?: MediaItem;
}

export type Mood = 'happy' | 'sleepy' | 'zoomies' | 'grumpy' | 'curious' | 'loved';

export interface DiaryEntry { id: ID; petId: ID; date: ISODate; mood: Mood; text: string; aiWritten?: boolean }

export interface Album {
  id: ID; title: string; petIds: ID[]; contributorIds: ID[]; media: MediaItem[]; updatedAt: ISODate;
}

export interface Badge {
  id: ID; name: string; description: string; icon: string; color: string; tier: 'bronze' | 'silver' | 'gold' | 'legend';
}

export interface Challenge {
  id: ID; title: string; description: string; icon: string; goal: number; unit: string; progress: number;
  reward: number; endsAt: ISODate; joined: boolean; participants: number; color: string;
}

export interface ContestEntry { id: ID; petId: ID; media: MediaItem; votes: number }
export interface Contest {
  id: ID; title: string; theme: string; cover: MediaItem; endsAt: ISODate; prize: string;
  entries: ContestEntry[]; votedEntryId?: ID; enteredPetId?: ID; color: string;
}

export interface LostAlert {
  id: ID; petName: string; species: Species; breed: string; photo: MediaItem; lastSeen: string;
  x: number; y: number; createdAt: ISODate; status: 'lost' | 'found'; reporterOwnerId: ID;
  description: string; reward?: number; sightings: number; sightedByMe?: boolean; contact: string;
}

export interface AdoptionPet {
  id: ID; name: string; species: Species; breed: string; ageLabel: string; sex: 'boy' | 'girl';
  size: 'small' | 'medium' | 'large'; photo: MediaItem; shelter: string; distanceKm: number;
  traits: string[]; story: string; goodWith: string[]; favorite: boolean; applied: boolean; daysWaiting: number;
}

export interface Coupon { id: ID; offerId: ID; placeId: ID; code: string; redeemedAt: ISODate }
export interface LedgerEntry { id: ID; amount: number; reason: string; at: ISODate }

export interface Rewards {
  treats: number;
  streak: number;
  lastCheckIn?: ISODate;
  lastSpin?: ISODate;
  coupons: Coupon[];
  ledger: LedgerEntry[];
}

export interface Database {
  version: number;
  meId: ID;
  activePetId: ID;
  owners: Record<ID, Owner>;
  pets: Record<ID, Pet>;
  followingPetIds: ID[];
  posts: Record<ID, Post>;
  stories: Story[];
  walks: Walk[];
  places: Place[];
  events: PetEvent[];
  packs: Pack[];
  conversations: Conversation[];
  notifications: AppNotification[];
  memories: Memory[];
  diary: DiaryEntry[];
  albums: Album[];
  badges: Badge[];
  challenges: Challenge[];
  contests: Contest[];
  lost: LostAlert[];
  adoption: AdoptionPet[];
  rewards: Rewards;
  weeklyGoalKm: number;
}
