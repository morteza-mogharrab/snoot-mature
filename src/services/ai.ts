import type { Mood, Personality, Pet, Species } from '../types';

/**
 * "Snoot AI" — every AI feature goes through this interface. The demo ships a
 * local, template-based provider so it works offline; replace `ai` with a
 * provider that calls your LLM endpoint (keep the same method signatures).
 */
export type Tone = 'wholesome' | 'dramatic' | 'sassy' | 'poetic' | 'chaotic';

export interface PostIdea { emoji: string; title: string; prompt: string }
export interface BreedGuess { species: Species; breed: string; confidence: number }
export interface ChatTurn { from: 'me' | 'pet'; text: string }

export interface AiProvider {
  captions(input: { pet: Pet; tone: Tone; context?: string }): Promise<string[]>;
  hashtags(input: { pet: Pet; caption: string }): Promise<string[]>;
  improve(input: { pet: Pet; text: string }): Promise<string>;
  ideas(input: { pet: Pet }): Promise<PostIdea[]>;
  personality(input: { pet: Pick<Pet, 'name' | 'species' | 'breed' | 'stats' | 'traits'> }): Promise<Personality>;
  diary(input: { pet: Pet; mood: Mood; events?: string }): Promise<string>;
  chat(input: { pet: Pet; history: ChatTurn[]; message: string }): Promise<string>;
  identify(input: { fileName: string }): Promise<BreedGuess[]>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pickOne = <T,>(a: T[], seed: number) => a[Math.abs(seed) % a.length];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
let calls = 0;

const OPENERS: Record<Tone, string[]> = {
  wholesome: ['Just a {species} living my best life', 'Grateful for sunshine, snacks and my human', 'Today’s mood: soft and very loved', 'Small joys, big tail wags'],
  dramatic: ['They said I couldn’t have the {fav}. They were wrong.', 'In a world where snacks are rationed… one {species} dared to dream', 'I have been wronged. Again.', 'Behold. The main character has entered the chat.'],
  sassy: ['Not me being the cutest one here. Again.', 'My human thinks they’re in charge. Adorable.', 'I don’t do mornings. Or rules.', 'Rate me 10/10 or keep scrolling'],
  poetic: ['Leaves fall, ears flop, the world is soft today', 'Sunbeam, pillow, a heartbeat at my side', 'Wind in my fur, a whole afternoon ahead', 'Quiet paws, loud heart'],
  chaotic: ['I ATE A LEAF. IT WAS A GOOD LEAF.', 'zoomies at 3am because the vibes said so', 'knocked over 1 (one) plant. no regrets', 'brain empty, tail full speed'],
};
const CLOSERS: Record<Tone, string[]> = {
  wholesome: ['💛', '🐾✨', '🥹', '🌼'],
  dramatic: ['🎭', '👑', '(This is not a drill.)', '😤'],
  sassy: ['💅', '😏', 'You’re welcome.', '🙄✨'],
  poetic: ['🍂', '🌙', '🌿', '☁️'],
  chaotic: ['⚡️⚡️⚡️', '🌀', 'AAAAA', '🤪'],
};

function speciesWord(s: Species) {
  return { dog: 'pup', cat: 'cat', bird: 'birb', small: 'tiny critter', fish: 'fish' }[s];
}

const fill = (t: string, pet: Pet) => t.replace('{species}', speciesWord(pet.species)).replace('{fav}', pet.favorites[0]?.toLowerCase() ?? 'snack');

export const localAi: AiProvider = {
  async captions({ pet, tone, context }) {
    await wait(700);
    const seed = hash(pet.id + tone) + calls++;
    const ctx = context?.trim() ? ` ${context.trim().replace(/\.$/, '')}.` : '';
    return [0, 1, 2].map((k) => {
      const o = fill(pickOne(OPENERS[tone], seed + k), pet);
      const quirk = pet.personality.quirks[(seed + k) % pet.personality.quirks.length]?.toLowerCase();
      const middle = k === 1 && quirk ? ` Fun fact: I ${quirk.replace(/^(i |my )/, '')}.` : k === 2 ? ` — ${pet.name}, ${pet.breed}` : '';
      return `${o}${ctx}${middle} ${pickOne(CLOSERS[tone], seed + k)}`.replace(/\s+/g, ' ').trim();
    });
  },
  async hashtags({ pet, caption }) {
    await wait(400);
    const base = [pet.breed, pet.name, `${pet.species}sofsnoot`, pet.neighbourhood].map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const mood: string[] = [];
    if (/sleep|nap|loaf|tired/i.test(caption)) mood.push('naptime', 'sleepypets');
    if (/walk|trail|hike|park|beach/i.test(caption)) mood.push('adventurepets', 'walkies');
    if (/snack|treat|food|breakfast|cake/i.test(caption)) mood.push('snacktime', 'foodiepets');
    if (/leaf|leaves|autumn|fall/i.test(caption)) mood.push('autumnvibes');
    if (/snow/i.test(caption)) mood.push('snowdays');
    if (pet.stats.energy > 85) mood.push('zoomies');
    if (pet.stats.cuddles > 85) mood.push('cuddlebug');
    return [...new Set([...base, ...mood, 'snootoftheday', 'petsofmaplewood'])].slice(0, 9).map((t) => `#${t}`);
  },
  async improve({ pet, text }) {
    await wait(600);
    const t = text.trim();
    if (!t) return `Hi, I’m ${pet.name}! ${pet.bio}`;
    const sentence = t.charAt(0).toUpperCase() + t.slice(1).replace(/\s+/g, ' ');
    const end = /[.!?…]$/.test(sentence) ? '' : '.';
    const flourish = pickOne(CLOSERS[pet.personality.voice === 'zen' ? 'poetic' : pet.personality.voice === 'chaotic' ? 'chaotic' : pet.personality.voice === 'sassy' ? 'sassy' : pet.personality.voice === 'dramatic' ? 'dramatic' : 'wholesome'], hash(t));
    return `${sentence}${end} ${flourish}`;
  },
  async ideas({ pet }) {
    await wait(500);
    const all: PostIdea[] = [
      { emoji: '🎂', title: 'Birthday countdown', prompt: `A “${pet.name} is almost another year older” post with your favourite photo from this year.` },
      { emoji: '📸', title: 'Then vs now', prompt: `Pair a baby photo of ${pet.name} with today. Caption it in their voice.` },
      { emoji: '🍽️', title: 'Snack review', prompt: `Have ${pet.name} rate their favourite treat out of 10 — in the voice of a food critic.` },
      { emoji: '🗺️', title: 'Walk diary', prompt: 'Share today’s walk map and the three best smells along the way.' },
      { emoji: '🎭', title: 'Day in the life', prompt: `A carousel of ${pet.name}’s schedule: nap, snack, judge, nap.` },
      { emoji: '🧸', title: 'Favourite things', prompt: `Show off ${pet.favorites.slice(0, 2).join(' and ')} with a tiny “museum tour” caption.` },
      { emoji: '🤝', title: 'Best friend feature', prompt: `Tag ${pet.name}’s best pet friend and tell the story of how they met.` },
      { emoji: '💤', title: 'Sleepiest pose', prompt: 'Enter this week’s Sleepiest Pose contest with your most dramatic nap shot.' },
    ];
    const s = hash(pet.id) + calls++;
    return [0, 1, 2, 3].map((k) => all[(s + k * 3) % all.length]).filter((v, i, a) => a.indexOf(v) === i);
  },
  async personality({ pet }) {
    await wait(900);
    const { energy, cuddles, mischief, appetite, social } = pet.stats;
    const top = Object.entries(pet.stats).sort((a, b) => b[1] - a[1])[0][0];
    const archetypes: Record<string, string[]> = {
      energy: ['The Zoomie Athlete', 'The Perpetual Motion Machine'],
      cuddles: ['The Professional Cuddler', 'The Velcro Sweetheart'],
      mischief: ['The Lovable Agent of Chaos', 'The Tiny Heist Planner'],
      appetite: ['The Snack Strategist', 'The Gourmet Critic'],
      social: ['The Neighbourhood Mayor', 'The Social Butterfly'],
    };
    const voice: Personality['voice'] = mischief > 85 ? 'chaotic' : energy < 40 ? 'zen' : social < 50 ? 'sassy' : cuddles > 85 ? 'wholesome' : 'dramatic';
    return {
      archetype: pickOne(archetypes[top], hash(pet.name)),
      voice,
      summary: `${pet.name} is a ${pet.breed.toLowerCase()} with ${energy > 70 ? 'boundless energy' : 'a relaxed outlook'}, ${cuddles > 70 ? 'a deeply affectionate streak' : 'an independent heart'} and ${appetite > 80 ? 'a legendary appetite' : 'refined taste'}. Most likely to ${mischief > 70 ? 'steal something and look innocent' : 'greet you at the door every single time'}.`,
      quirks: [
        energy > 70 ? 'Gets the zoomies right after dinner' : 'Takes a nap break mid-walk',
        cuddles > 70 ? 'Leans on legs for maximum contact' : 'Sits just out of reach, on purpose',
        appetite > 80 ? 'Hears a crisp packet from three rooms away' : 'Sniffs every meal before committing',
      ],
    };
  },
  async diary({ pet, mood, events }) {
    await wait(800);
    const open: Record<Mood, string> = {
      happy: 'Dear diary, today was a tail-wagger.', sleepy: 'Dear diary… *yawn*… I napped six times today.', zoomies: 'DEAR DIARY. TODAY I RAN. EVERYWHERE.',
      grumpy: 'Dear diary, I have complaints.', curious: 'Dear diary, something new happened and I must investigate.', loved: 'Dear diary, my human sat with me for ages today.',
    };
    const extra = events?.trim() ? ` ${events.trim().replace(/\.$/, '')}.` : '';
    const favs = pet.favorites[0] ? ` Highlight: ${pet.favorites[0].toLowerCase()}.` : '';
    const sign = { happy: 'Ten out of ten.', sleepy: 'Goodnight.', zoomies: 'MORE TOMORROW.', grumpy: 'I will forgive them by dinner.', curious: 'Investigation continues.', loved: 'Best day.' }[mood];
    return `${open[mood]}${extra}${favs} ${sign} — ${pet.name} 🐾`;
  },
  async chat({ pet, message }) {
    await wait(700 + Math.random() * 500);
    const m = message.toLowerCase();
    const v = pet.personality.voice;
    const style = (t: string) => ({
      wholesome: `${t} 🥹💛`, dramatic: `${t}! Truly, the drama of it all. 🎭`, sassy: `${t}. Obviously. 💅`, zen: `${t}… breathe in, sniff out. 🍃`, chaotic: `${t.toUpperCase()}!!! ⚡️`,
    }[v]);
    if (/hungry|food|treat|snack|dinner|breakfast/.test(m)) return style(`Is it ${pet.favorites.find((f) => /cheese|tuna|carrot|treat|chicken|potato|millet|grape|worm/i.test(f)) ?? 'snack'} time? It is always snack time in my heart`);
    if (/walk|park|outside|trail/.test(m)) return style(pet.stats.energy > 70 ? 'WALK?! Get the lead, I’ll get my enthusiasm' : 'A walk sounds lovely, as long as we stop for every interesting smell');
    if (/love|good (boy|girl)|cute|best/.test(m)) return style(`I love you too. You are my favourite human, and I have met at least ${Math.round(pet.stats.social / 3)}`);
    if (/bath|vet|nail/.test(m)) return style('I don’t know what that word means and I would like to keep it that way');
    if (/how are you|how's it going|what are you doing/.test(m)) return style(`Currently ${pet.stats.cuddles > 80 ? 'waiting for cuddles' : 'supervising the household'}. Also thinking about ${pet.favorites[0]?.toLowerCase() ?? 'snacks'}`);
    if (/who|what are you|tell me about/.test(m)) return style(`I’m ${pet.name}, ${pet.personality.archetype.toLowerCase().replace(/^the /, 'the ')}. ${pet.personality.quirks[0]}`);
    return style(pickOne([
      `Interesting. I will consider this while lying in a sunbeam`,
      `Hmm. Can we discuss this over ${pet.favorites[0]?.toLowerCase() ?? 'a snack'}?`,
      `I heard you. I am choosing to respond with a slow blink`,
      `That reminds me of the time I ${pet.personality.quirks[1]?.toLowerCase() ?? 'did something brilliant'}`,
    ], hash(message)));
  },
  async identify({ fileName }) {
    await wait(1300);
    const s = hash(fileName);
    const dogs = ['Golden Retriever', 'Cavapoo', 'Border Collie', 'Mixed breed', 'Labrador Retriever', 'Australian Shepherd'];
    const top = pickOne(dogs, s);
    return [
      { species: 'dog', breed: top, confidence: 0.82 + (Math.abs(s) % 12) / 100 },
      { species: 'dog', breed: pickOne(dogs, s + 1), confidence: 0.09 },
      { species: 'cat', breed: 'Domestic shorthair', confidence: 0.03 },
    ];
  },
};

export const ai: AiProvider = localAi;

/** Reveal generated text gradually, like a streaming LLM response. */
export function typewriter(text: string, onChunk: (partial: string) => void, cps = 90): () => void {
  let i = 0;
  const id = window.setInterval(() => {
    i = Math.min(text.length, i + Math.max(1, Math.round(cps / 30)));
    onChunk(text.slice(0, i));
    if (i >= text.length) window.clearInterval(id);
  }, 33);
  return () => window.clearInterval(id);
}
