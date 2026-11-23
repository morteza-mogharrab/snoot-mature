import { Coffee, GraduationCap, Mountain, PartyPopper, Scissors, ShoppingBag, Sparkles, Stethoscope, Trees, Trophy, Users, Waves, HeartHandshake, Medal } from 'lucide-react';
import type { EventCategory, PlaceCategory } from '../types';

export const PLACE_META: Record<PlaceCategory, { label: string; plural: string; color: string; icon: React.ReactNode; soft: string }> = {
  park: { label: 'Park', plural: 'Parks', color: '#3e6a56', soft: 'var(--mint-soft)', icon: <Trees size={16} strokeWidth={2.4} /> },
  trail: { label: 'Trail', plural: 'Trails', color: '#4f6b3a', soft: 'var(--mint-soft)', icon: <Mountain size={16} strokeWidth={2.4} /> },
  beach: { label: 'Beach', plural: 'Beaches', color: '#3f6f86', soft: 'var(--sky-soft)', icon: <Waves size={16} strokeWidth={2.4} /> },
  vet: { label: 'Vet', plural: 'Vets', color: '#bf5634', soft: 'var(--coral-soft)', icon: <Stethoscope size={16} strokeWidth={2.4} /> },
  store: { label: 'Pet store', plural: 'Stores', color: '#6c5b7b', soft: 'var(--lilac-soft)', icon: <ShoppingBag size={16} strokeWidth={2.4} /> },
  groomer: { label: 'Groomer', plural: 'Groomers', color: '#a65a6b', soft: 'var(--pink-soft)', icon: <Scissors size={16} strokeWidth={2.4} /> },
  cafe: { label: 'Café', plural: 'Cafés', color: '#9a7535', soft: 'var(--honey-soft)', icon: <Coffee size={16} strokeWidth={2.4} /> },
  trainer: { label: 'Training', plural: 'Training', color: '#46617c', soft: 'var(--sky-soft)', icon: <GraduationCap size={16} strokeWidth={2.4} /> },
};

export const EVENT_META: Record<EventCategory, { label: string; color: string; icon: React.ReactNode }> = {
  meetup: { label: 'Meetup', color: '#3e6a56', icon: <Users size={14} /> },
  adoption: { label: 'Adoption', color: '#3e6a56', icon: <HeartHandshake size={14} /> },
  competition: { label: 'Competition', color: '#9a7535', icon: <Trophy size={14} /> },
  training: { label: 'Training', color: '#46617c', icon: <GraduationCap size={14} /> },
  show: { label: 'Show', color: '#6c5b7b', icon: <Medal size={14} /> },
  party: { label: 'Party', color: '#a65a6b', icon: <PartyPopper size={14} /> },
};

export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' }, { id: 'zoomies', emoji: '⚡️', label: 'Zoomies' }, { id: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { id: 'curious', emoji: '🧐', label: 'Curious' }, { id: 'loved', emoji: '🥰', label: 'Loved' }, { id: 'grumpy', emoji: '😤', label: 'Grumpy' },
] as const;

export const STAT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  energy: { label: 'Energy', emoji: '⚡️', color: '#b08a45' },
  cuddles: { label: 'Cuddles', emoji: '🫶', color: '#a65a6b' },
  mischief: { label: 'Mischief', emoji: '😈', color: '#6c5b7b' },
  appetite: { label: 'Appetite', emoji: '🍖', color: '#bf5634' },
  social: { label: 'Social', emoji: '🐾', color: '#3e6a56' },
};

export const SparkleIcon = Sparkles;
