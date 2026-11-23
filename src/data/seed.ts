/**
 * Sample content for the Snoot demo. Every pet, person, place, event and caption is
 * invented. Photos come from a free sample collection (Pixabay-derived, see README).
 */
import type {
  Aspect, Album, AdoptionPet, AppNotification, Badge, Challenge, Comment, Contest, Conversation, Database,
  DiaryEntry, LostAlert, MediaItem, Memory, Owner, Pack, Pet, PetEvent, PetStats, Personality, Place, Post,
  Species, Story, Walk,
} from '../types';
import { MEDIA_ASPECT } from './mediaManifest';
import { routeLength, generateLoop } from '../utils/geo';

export const SEED_VERSION = 8;

// ------------------------------------------------------------------ helpers
const MIN = 60_000;
const H = 60;
const D = 24 * H;
const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * MIN).toISOString();
const inDays = (days: number, hour = 10, minute = 0) => {
  const d = new Date(now + days * 86_400_000);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const dateYearsAgo = (years: number, monthOffset = 0, day = 1) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() + monthOffset, day);
  return d.toISOString();
};
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const rand = rng(20261122);
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

export const photo = (n: number, alt = ''): MediaItem => ({ src: `media/p/${n}.jpg`, thumb: `media/t/${n}.jpg`, alt });
const av = (n: number) => `media/a/${n}.jpg`;
const aspectOf = (n: number): Aspect => MEDIA_ASPECT[n] ?? '1:1';

// ------------------------------------------------------------------ owners
const ownerRows: [string, string, number, string, string][] = [
  ['maya', 'Maya Rivera', 784, 'Maplewood', 'Plant person, pet person, person person. Mum to a doodle, a herder and a tiny chaos kitten.'],
  ['leo', 'Leo Park', 1289, 'Harbourside', 'Designer. Golden retriever correspondent.'],
  ['priya', 'Priya Nair', 589, 'Maplewood', 'Two pets, zero personal space.'],
  ['sam', 'Sam Okafor', 951, 'Old Mill', 'Frenchie dad. Coffee enthusiast. Wears dog hair as an accessory.'],
  ['hana', 'Hana Sato', 710, 'Cedar Hill', 'Florist. My cat and my samoyed run the shop.'],
  ['chloe', 'Chloé Bernard', 98, 'Maplewood', 'Agility weekends with Fig.'],
  ['amara', 'Amara Osei', 136, 'Riverside', 'Dancer, chocolate lab enthusiast.'],
  ['elena', 'Elena Petrova', 482, 'Cedar Hill', 'Running with a husky who refuses to run.'],
  ['isla', 'Isla Morgan', 597, 'Old Mill', 'Red dog, red hat, red cheeks from the wind.'],
  ['marco', 'Marco Bellini', 813, 'Harbourside', 'Two silver ghosts and a very hairy sofa.'],
  ['sofia', 'Sofia Marchetti', 193, 'Riverside', 'Travel writer, Pekingese bodyguard.'],
  ['mia', 'Mia Sullivan', 38, 'Maplewood', 'A yorkie and a cat who hate each other lovingly.'],
  ['yuki', 'Yuki Tanaka', 240, 'Cedar Hill', 'Birb household. Expect singing at 6am.'],
  ['lena', 'Lena Hoffmann', 262, 'Old Mill', 'My sphynx is warmer than my radiator.'],
  ['jiwoo', 'Jiwoo Kim', 324, 'Riverside', 'Cat mum ×2. Professional lint roller.'],
  ['mei', 'Mei Ling', 377, 'Maplewood', 'Hedgehog keeper and watercolourist.'],
  ['kenji', 'Kenji Nakamura', 181, 'Harbourside', 'Slow walks with a slow basset.'],
  ['ava', 'Ava Thompson', 152, 'Old Mill', 'Sausage dog supremacist.'],
  ['linh', 'Linh Tran', 1009, 'Riverside', 'Fish tank aesthetics and a very loud tabby.'],
  ['theo', 'Theo Lindqvist', 166, 'Cedar Hill', 'Two Aussies, one tired human.'],
];
const owners: Record<string, Owner> = {};
for (const [id, name, a, city, bio] of ownerRows) owners[id] = { id, name, handle: id, avatar: av(a), city, bio, petIds: [] };

// ------------------------------------------------------------------ pets
type PetRow = {
  id: string; name: string; species: Species; breed: string; sex: 'boy' | 'girl'; age: [number, number]; owner: string;
  avatar: number; cover: number; bio: string; traits: string[]; favorites: string[]; stats: [number, number, number, number, number];
  personality: Personality; followers: number; following: number; badges: string[]; verified?: boolean; xp: number; gotcha?: [number, number];
};
const P = (r: PetRow) => r;
const petRows: PetRow[] = [
  P({ id: 'biscuit', name: 'Biscuit', species: 'dog', breed: 'Cavapoo', sex: 'boy', age: [0, 0], owner: 'maya', avatar: 1213, cover: 1258, xp: 2480,
    bio: 'Professional sock thief. Part-time therapist. Full-time snack inspector.', traits: ['Velcro dog', 'Sock bandit', 'Puddle magnet'],
    favorites: ['Squeaky hedgehog', 'Belly rubs', 'Cheese (forbidden)'], stats: [82, 95, 70, 88, 92], followers: 3412, following: 188,
    personality: { archetype: 'The Golden Retriever Soul in a Small Body', voice: 'wholesome', summary: 'Believes every stranger is a friend who simply hasn’t met him yet. Will trade loyalty for cheese at a very favourable rate.', quirks: ['Sneezes when excited', 'Carries a sock to greet guests', 'Sleeps upside down'] },
    badges: ['first-boop', 'social-butterfly', 'explorer', 'streak-7', 'early-riser'] }),
  P({ id: 'juniper', name: 'Juniper', species: 'dog', breed: 'Australian Shepherd', sex: 'girl', age: [4, 2], owner: 'maya', avatar: 1114, cover: 1006, xp: 7820, gotcha: [4, 4],
    bio: 'Herding everything that moves since 2022. Mostly Biscuit. Sometimes the Roomba.', traits: ['Workaholic', 'Frisbee prodigy', 'Side-eye expert'],
    favorites: ['Frisbee', 'Cedar Hollow Trail', 'Being in charge'], stats: [96, 62, 74, 70, 68], followers: 8904, following: 241,
    personality: { archetype: 'The Middle Manager', voice: 'sassy', summary: 'Runs the household like a tight ship and expects a performance review every evening. Secretly soft after 9pm.', quirks: ['Herds the kids at the park', 'Talks back in little grumbles', 'Rates every walk out of ten'] },
    badges: ['trailblazer', '100km', 'rain-or-shine', 'pack-leader', 'streak-7', 'early-riser', 'explorer'] }),
  P({ id: 'mochi', name: 'Mochi', species: 'cat', breed: 'Tabby kitten', sex: 'girl', age: [0, -6], owner: 'maya', avatar: 670, cover: 1212, xp: 640,
    bio: 'Six months old. Already owns the house. Attacks ankles at 3am for cardio.', traits: ['Tiny menace', 'Box connoisseur', 'Purr engine'],
    favorites: ['Hair ties', 'The top of the fridge', 'Biscuit’s tail'], stats: [90, 80, 98, 75, 60], followers: 1206, following: 54,
    personality: { archetype: 'The Chaos Gremlin', voice: 'chaotic', summary: 'Small, fast and legally a menace. Will knock it off the table to see what happens, then fall asleep in your lap like nothing happened.', quirks: ['Chirps at birds through the window', 'Steals hair ties', 'Zoomies after the litter box'] },
    badges: ['first-boop'] }),
  P({ id: 'sunny', name: 'Sunny', species: 'dog', breed: 'Golden Retriever', sex: 'boy', age: [7, 1], owner: 'leo', avatar: 574, cover: 695, xp: 15400, verified: true,
    bio: 'Golden boy, golden hour, golden heart. 7 years of being a very good boy.', traits: ['Gentle giant', 'Tennis ball loyalist', 'Lake swimmer'],
    favorites: ['Tennis balls', 'Harbour Beach', 'Leo’s pillow'], stats: [70, 99, 30, 92, 99], followers: 48210, following: 312,
    personality: { archetype: 'The Golden Hour Philosopher', voice: 'zen', summary: 'Moves through life slowly and with great kindness. Has never met a ball, a child or a puddle he didn’t love.', quirks: ['Brings you a gift every time you come home', 'Smiles with his whole face', 'Leans on people'] },
    badges: ['legend', '100km', 'birthday-star', 'social-butterfly', 'photogenic'] }),
  P({ id: 'bento', name: 'Bento', species: 'dog', breed: 'Shiba Inu', sex: 'boy', age: [3, 5], owner: 'priya', avatar: 533, cover: 1152, xp: 6120,
    bio: 'Fox-shaped. Opinionated. Will scream if bath.', traits: ['Drama king', 'Escape artist', 'Fluffy pants'],
    favorites: ['Autumn leaves', 'Not being touched', 'Sweet potato'], stats: [78, 40, 88, 80, 45], followers: 21840, following: 96,
    personality: { archetype: 'The Tiny Emperor', voice: 'dramatic', summary: 'Believes he is royalty and that the household is his loyal staff. Does a scream so dramatic it has its own fanbase.', quirks: ['The Shiba scream', 'Refuses to walk in rain', 'Sits like a little statue'] },
    badges: ['photogenic', 'social-butterfly'] }),
  P({ id: 'ziggy', name: 'Ziggy', species: 'cat', breed: 'Bengal', sex: 'boy', age: [2, 3], owner: 'priya', avatar: 1089, cover: 1310, xp: 3010,
    bio: 'Mini leopard. Leash trained. Climbs things he shouldn’t.', traits: ['Explorer', 'Water lover', 'Parkour'],
    favorites: ['Harness adventures', 'Running taps', 'Feather wands'], stats: [94, 55, 85, 70, 65], followers: 15530, following: 88,
    personality: { archetype: 'The Jungle Adventurer', voice: 'dramatic', summary: 'A wild cat trapped in a two-bedroom apartment. Narrates his own documentaries.', quirks: ['Plays fetch', 'Drinks from the tap only', 'Walks on a leash better than Bento'] },
    badges: ['explorer'] }),
  P({ id: 'waffles', name: 'Waffles', species: 'dog', breed: 'French Bulldog', sex: 'boy', age: [2, 8], owner: 'sam', avatar: 667, cover: 1310, xp: 4200,
    bio: 'Snorts, snores and snuggles. Café regular.', traits: ['Couch potato', 'Snorer', 'Café regular'],
    favorites: ['Pup cups', 'Barkery & Brew', 'Naps (all of them)'], stats: [45, 96, 60, 99, 90], followers: 12210, following: 401,
    personality: { archetype: 'The Café Critic', voice: 'sassy', summary: 'Knows every pet-friendly café in town and has strong opinions about all of them. Snores through the bad ones.', quirks: ['Sits like a frog', 'Rates pup cups out of five snorts', 'Sneezes on command'] },
    badges: ['snack-connoisseur', 'explorer', 'social-butterfly'] }),
  P({ id: 'nimbus', name: 'Nimbus', species: 'dog', breed: 'Samoyed', sex: 'boy', age: [5, 0], owner: 'hana', avatar: 82, cover: 1253, xp: 8800,
    bio: 'Cloud in dog form. Sheds enough to knit a second Nimbus.', traits: ['Smiley', 'Snow lover', 'Talker'],
    favorites: ['Snow days', 'Flower shop window', 'Sticks'], stats: [80, 90, 50, 75, 95], followers: 31780, following: 205,
    personality: { archetype: 'The Cloud', voice: 'wholesome', summary: 'Floats through the world smiling. Leaves a trail of white fluff and happy strangers.', quirks: ['Woo-woos at the door', 'Rolls in snow on purpose', 'Leans in for photos'] },
    badges: ['rain-or-shine', 'photogenic', 'social-butterfly'] }),
  P({ id: 'earlgrey', name: 'Earl Grey', species: 'cat', breed: 'American Shorthair', sex: 'boy', age: [6, 0], owner: 'hana', avatar: 1113, cover: 1138, xp: 2210,
    bio: 'Distinguished gentleman. Supervises the flower shop.', traits: ['Refined', 'Judgemental', 'Window watcher'],
    favorites: ['Sunbeams', 'The till', 'Tuna (served properly)'], stats: [30, 60, 35, 80, 40], followers: 9870, following: 12,
    personality: { archetype: 'The Distinguished Gentleman', voice: 'dramatic', summary: 'Conducts himself with dignity at all times, except around a laser pointer.', quirks: ['Inspects every bouquet', 'Sits on the receipt printer', 'Ignores Nimbus with style'] },
    badges: [] }),
  P({ id: 'fig', name: 'Fig', species: 'dog', breed: 'Border Collie', sex: 'girl', age: [3, 9], owner: 'chloe', avatar: 718, cover: 924, xp: 9400,
    bio: 'Agility champion (local, but still). Has a bigger vocabulary than you.', traits: ['Genius', 'Athlete', 'Intense eye contact'],
    favorites: ['Weave poles', 'Puzzle toys', 'Learning new tricks'], stats: [99, 65, 60, 70, 75], followers: 19920, following: 150,
    personality: { archetype: 'The Overachiever', voice: 'zen', summary: 'Will learn a trick in four minutes, then teach it to the other dogs. Needs a job, a hobby and a side quest.', quirks: ['Knows 64 toys by name', 'Stares until you throw it', 'Tidies her toys away'] },
    badges: ['pack-leader', 'trailblazer', 'photogenic', '100km'] }),
  P({ id: 'cocoa', name: 'Cocoa', species: 'dog', breed: 'Labrador Retriever', sex: 'girl', age: [5, 4], owner: 'amara', avatar: 66, cover: 1166, xp: 5100,
    bio: 'Chocolate lab, zero calories. Will sit for a single kibble.', traits: ['Food motivated', 'Swimmer', 'Gentle'],
    favorites: ['Carrots', 'The lake', 'Amara’s dance practice'], stats: [75, 92, 40, 100, 85], followers: 7430, following: 220,
    personality: { archetype: 'The Snack Strategist', voice: 'wholesome', summary: 'Every action is a carefully calculated step towards a snack. Extremely loving in between.', quirks: ['Smells cheese through walls', 'Swims in any water', 'Gentle mouth with eggs'] },
    badges: ['snack-connoisseur', 'rain-or-shine'] }),
  P({ id: 'kodiak', name: 'Kodiak', species: 'dog', breed: 'Siberian Husky', sex: 'boy', age: [4, 6], owner: 'elena', avatar: 795, cover: 1081, xp: 6700,
    bio: 'Built for sleds, chose sofas. Will argue with you about it.', traits: ['Talker', 'Escape artist', 'Snow beast'],
    favorites: ['Arguing', 'Snow', 'Ice cubes'], stats: [97, 55, 92, 70, 70], followers: 24400, following: 130,
    personality: { archetype: 'The Opera Singer', voice: 'dramatic', summary: 'Every opinion is delivered as a full aria. Has escaped the garden eleven times and returned with a stick every time.', quirks: ['Howls at sirens', 'Digs to Australia', 'Refuses the lead in summer'] },
    badges: ['rain-or-shine', 'trailblazer'] }),
  P({ id: 'rusty', name: 'Rusty', species: 'dog', breed: 'Irish Setter', sex: 'boy', age: [6, 2], owner: 'isla', avatar: 258, cover: 837, xp: 7100,
    bio: 'Red flag (the good kind). Runs like a shampoo advert.', traits: ['Elegant', 'Goofy', 'Forest runner'],
    favorites: ['Autumn forests', 'Squirrels', 'Wind in his ears'], stats: [92, 80, 65, 75, 88], followers: 13360, following: 175,
    personality: { archetype: 'The Shampoo Model', voice: 'wholesome', summary: 'Majestic from a distance, chaotic up close. Has never once walked when he could gallop.', quirks: ['Points at birds', 'Flops dramatically', 'Steals gloves'] },
    badges: ['photogenic', 'trailblazer'] }),
  P({ id: 'pepper', name: 'Pepper & Ash', species: 'dog', breed: 'Weimaraners', sex: 'girl', age: [3, 0], owner: 'marco', avatar: 879, cover: 693, xp: 5400,
    bio: 'Two grey ghosts, one account. Pepper does the thinking, Ash does the zooming.', traits: ['Duo', 'Velcro dogs', 'Zoomies'],
    favorites: ['Leaf piles', 'Each other', 'The sofa (both ends)'], stats: [95, 88, 80, 82, 80], followers: 10220, following: 140,
    personality: { archetype: 'The Double Act', voice: 'chaotic', summary: 'A comedy duo in silver suits. If one is doing something, the other is doing it louder.', quirks: ['Synchronised head tilts', 'Steal each other’s beds', 'Lean on visitors'] },
    badges: ['social-butterfly'] }),
  P({ id: 'dumpling', name: 'Dumpling', species: 'dog', breed: 'Pekingese', sex: 'girl', age: [8, 0], owner: 'sofia', avatar: 1316, cover: 1258, xp: 4300,
    bio: 'Senior royalty. Floof first, walk later (maybe).', traits: ['Royal', 'Senior', 'Floof'],
    favorites: ['Cushions', 'Sofia’s handbag', 'Being carried'], stats: [25, 85, 30, 85, 60], followers: 16610, following: 45,
    personality: { archetype: 'The Dowager', voice: 'dramatic', summary: 'A retired empress who accepts tributes in the form of chicken. Walks precisely as far as she chooses.', quirks: ['Sits down mid-walk to be carried', 'Snores like a tiny engine', 'Hates the hoover'] },
    badges: ['birthday-star'] }),
  P({ id: 'tilly', name: 'Tilly', species: 'dog', breed: 'Yorkshire Terrier', sex: 'girl', age: [4, 0], owner: 'mia', avatar: 946, cover: 1310, xp: 2800,
    bio: '3 kg of attitude. Flower bed inspector.', traits: ['Fearless', 'Tiny', 'Loud'],
    favorites: ['Daisies', 'Barking at big dogs', 'Pink bows (under protest)'], stats: [88, 70, 85, 60, 55], followers: 5530, following: 300,
    personality: { archetype: 'The Tiny Bodyguard', voice: 'sassy', summary: 'Small dog, big security clearance. Will protect you from every postman in the postcode.', quirks: ['Barks at her reflection', 'Rides in a bike basket', 'Bosses Marmalade'] },
    badges: ['explorer'] }),
  P({ id: 'marmalade', name: 'Marmalade', species: 'cat', breed: 'Ginger tabby', sex: 'boy', age: [5, 0], owner: 'mia', avatar: 865, cover: 1212, xp: 3900,
    bio: 'One brain cell, shared with all orange cats. Today is my turn.', traits: ['Napper', 'Orange', 'Food critic'],
    favorites: ['Radiators', 'Cardboard', 'Breakfast (twice)'], stats: [35, 90, 60, 98, 70], followers: 20450, following: 20,
    personality: { archetype: 'The Lovable Loaf', voice: 'chaotic', summary: 'Holds the household’s orange-cat brain cell on Tuesdays. Spends it on falling off the sofa.', quirks: ['Sleeps in loaf mode', 'Yells for breakfast', 'Falls off things confidently'] },
    badges: ['photogenic'] }),
  P({ id: 'kiwi', name: 'Kiwi & Mango', species: 'bird', breed: 'Lovebirds', sex: 'girl', age: [2, 0], owner: 'yuki', avatar: 637, cover: 1310, xp: 1900,
    bio: 'Bonded pair. Sing at 6am. Kiss at 6:01am.', traits: ['Singers', 'Inseparable', 'Early risers'],
    favorites: ['Millet', 'Mirrors', 'Yuki’s shoulder'], stats: [80, 75, 65, 70, 70], followers: 6020, following: 64,
    personality: { archetype: 'The Duet', voice: 'wholesome', summary: 'Two birds, one heart, a lot of opinions about breakfast.', quirks: ['Preen each other', 'Duet with the kettle', 'Shred paper into confetti'] },
    badges: ['early-riser'] }),
  P({ id: 'pistachio', name: 'Pistachio', species: 'bird', breed: 'Indian Ringneck', sex: 'boy', age: [3, 0], owner: 'yuki', avatar: 453, cover: 1310, xp: 1500,
    bio: 'Says “hello”, “good bird” and the microwave beep.', traits: ['Talker', 'Mimic', 'Show-off'],
    favorites: ['Grapes', 'The microwave', 'Applause'], stats: [70, 50, 80, 75, 60], followers: 3880, following: 30,
    personality: { archetype: 'The Impressionist', voice: 'sassy', summary: 'Has a repertoire of 30 sounds and uses them to confuse every guest.', quirks: ['Does the doorbell', 'Whistles at Kiwi', 'Laughs like Yuki'] },
    badges: [] }),
  P({ id: 'pharaoh', name: 'Pharaoh', species: 'cat', breed: 'Sphynx', sex: 'boy', age: [3, 3], owner: 'lena', avatar: 679, cover: 1138, xp: 2600,
    bio: 'No fur, no problem. Lives in jumpers.', traits: ['Warm', 'Clingy', 'Sweater model'],
    favorites: ['Heated blankets', 'Cuddles', 'Knitted jumpers'], stats: [60, 99, 55, 80, 85], followers: 11090, following: 60,
    personality: { archetype: 'The Hot Water Bottle', voice: 'zen', summary: 'An ancient soul who just wants to be under the duvet with you.', quirks: ['Sleeps under covers', 'Head-butts for attention', 'Owns 14 jumpers'] },
    badges: [] }),
  P({ id: 'luna', name: 'Luna', species: 'cat', breed: 'Calico', sex: 'girl', age: [4, 0], owner: 'jiwoo', avatar: 184, cover: 1081, xp: 2900,
    bio: 'Snow princess. Patchwork queen.', traits: ['Independent', 'Snow cat', 'Talker'],
    favorites: ['Snow', 'Window seat', 'Salmon treats'], stats: [65, 55, 70, 70, 50], followers: 8650, following: 33,
    personality: { archetype: 'The Snow Queen', voice: 'dramatic', summary: 'Calico with a cold exterior and a warm, tuna-scented heart.', quirks: ['Chats back', 'Loves snow', 'Picks one human'] },
    badges: [] }),
  P({ id: 'oreo', name: 'Oreo', species: 'cat', breed: 'Tuxedo', sex: 'boy', age: [2, 0], owner: 'jiwoo', avatar: 188, cover: 1081, xp: 1400,
    bio: 'Tuxedo always. Formal events only. Tongue out 40% of the time.', traits: ['Blep', 'Dapper', 'Goofball'],
    favorites: ['Bleps', 'Crinkle balls', 'Luna (she disagrees)'], stats: [80, 70, 90, 75, 75], followers: 4320, following: 41,
    personality: { archetype: 'The Class Clown', voice: 'chaotic', summary: 'Dressed for a gala, behaves like a cartoon.', quirks: ['Forgets his tongue', 'Chases his tail', 'Steals Luna’s spot'] },
    badges: [] }),
  P({ id: 'spike', name: 'Spike', species: 'small', breed: 'African Pygmy Hedgehog', sex: 'boy', age: [1, 6], owner: 'mei', avatar: 755, cover: 1310, xp: 1100,
    bio: 'Small, spiky, secretly soft. Night shift only.', traits: ['Nocturnal', 'Huffy', 'Explorer'],
    favorites: ['Mealworms', 'Tunnels', 'Mei’s sleeve'], stats: [55, 40, 50, 85, 30], followers: 9020, following: 18,
    personality: { archetype: 'The Grumpy Pincushion', voice: 'sassy', summary: 'Huffs at everything, forgives everyone. Lives for the 2am zoomies.', quirks: ['Huffs and puffs', 'Self-anoints with new smells', 'Sleeps in a sock'] },
    badges: [] }),
  P({ id: 'clyde', name: 'Clyde', species: 'dog', breed: 'Basset Hound', sex: 'boy', age: [7, 0], owner: 'kenji', avatar: 1174, cover: 1141, xp: 5800,
    bio: 'Ears: 30 cm. Speed: 3 km/h. Nose: elite.', traits: ['Sniffer', 'Slow walker', 'Baritone'],
    favorites: ['Sniffing everything', 'Slow walks', 'Kenji’s slippers'], stats: [30, 85, 45, 95, 80], followers: 14110, following: 90,
    personality: { archetype: 'The Detective', voice: 'zen', summary: 'Approaches every walk as a crime scene investigation. Solves most cases with a nap.', quirks: ['Trips on his ears', 'Howls at the doorbell', 'Sighs dramatically'] },
    badges: ['trailblazer'] }),
  P({ id: 'pretzel', name: 'Pretzel', species: 'dog', breed: 'Dachshund', sex: 'boy', age: [4, 0], owner: 'ava', avatar: 1302, cover: 1152, xp: 4700,
    bio: 'Long boy. Autumn model. Pumpkin spice everything.', traits: ['Long', 'Stubborn', 'Burrower'],
    favorites: ['Blankets', 'Pumpkins', 'Barking at leaves'], stats: [70, 85, 75, 90, 65], followers: 17720, following: 210,
    personality: { archetype: 'The Burrito', voice: 'dramatic', summary: 'Would like to be wrapped in a blanket at all times. Will negotiate if bribed.', quirks: ['Burrows under everything', 'Refuses stairs', 'Sun-chaser'] },
    badges: ['photogenic', 'birthday-star'] }),
  P({ id: 'neptune', name: 'Neptune', species: 'fish', breed: 'Betta', sex: 'boy', age: [1, 0], owner: 'linh', avatar: 1211, cover: 1138, xp: 600,
    bio: 'Fins by design. Flares at his reflection. Tank is 40 L of drama.', traits: ['Fancy', 'Bubble-nest builder'],
    favorites: ['Bloodworms', 'His leaf hammock'], stats: [40, 20, 60, 70, 20], followers: 2210, following: 8,
    personality: { archetype: 'The Diva', voice: 'dramatic', summary: 'A ballgown with eyes. Has never once lost a staring contest.', quirks: ['Flares at mirrors', 'Builds bubble nests', 'Follows your finger'] },
    badges: [] }),
  P({ id: 'tiger', name: 'Tiger', species: 'cat', breed: 'Tabby', sex: 'boy', age: [9, 0], owner: 'linh', avatar: 551, cover: 1212, xp: 3300,
    bio: 'Old man of the block. Blue eyes, big opinions.', traits: ['Senior', 'Wise', 'Vocal'],
    favorites: ['Breakfast at 5am', 'The good chair'], stats: [25, 70, 40, 85, 50], followers: 6240, following: 15,
    personality: { archetype: 'The Grandad', voice: 'zen', summary: 'Has seen it all. Was unimpressed by most of it.', quirks: ['Yells at dawn', 'Sits on newspapers'] },
    badges: [] }),
  P({ id: 'maple', name: 'Maple', species: 'dog', breed: 'Australian Shepherd', sex: 'girl', age: [5, 0], owner: 'theo', avatar: 287, cover: 1006, xp: 6400,
    bio: 'Tri-colour trail dog. Will herd you up the mountain.', traits: ['Hiker', 'Herder', 'Smiley'],
    favorites: ['Summits', 'Snowballs', 'Blue'], stats: [92, 70, 60, 70, 80], followers: 11530, following: 160,
    personality: { archetype: 'The Trail Guide', voice: 'wholesome', summary: 'Knows every trail by smell and every hiker by snack.', quirks: ['Leads from the front', 'Waits at every fork', 'Shares sticks'] },
    badges: ['trailblazer', '100km'] }),
  P({ id: 'blue', name: 'Blue', species: 'dog', breed: 'Australian Shepherd', sex: 'boy', age: [2, 0], owner: 'theo', avatar: 392, cover: 1310, xp: 3100,
    bio: 'Merle baby. Crocus field enthusiast. Zero chill.', traits: ['Zoomies', 'Merle', 'Flower sniffer'],
    favorites: ['Spring flowers', 'Maple', 'Tug'], stats: [99, 75, 85, 75, 90], followers: 8120, following: 120,
    personality: { archetype: 'The Sunshine Tornado', voice: 'chaotic', summary: 'Exists at a constant 11 out of 10. Has never seen a flower he didn’t sniff.', quirks: ['Spins before dinner', 'Sniffs every crocus', 'Copies Maple'] },
    badges: [] }),
];

const pets: Record<string, Pet> = {};
for (const r of petRows) {
  const birthday = r.id === 'biscuit'
    ? (() => { const d = new Date(now + 14 * 86_400_000); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); })()
    : dateYearsAgo(r.age[0], r.age[1], 12);
  const s = r.stats;
  const stats: PetStats = { energy: s[0], cuddles: s[1], mischief: s[2], appetite: s[3], social: s[4] };
  pets[r.id] = {
    id: r.id, handle: r.id, name: r.name, species: r.species, breed: r.breed, sex: r.sex, birthday,
    gotchaDay: r.gotcha ? dateYearsAgo(r.gotcha[0], r.gotcha[1], 3) : undefined,
    avatar: av(r.avatar), cover: `media/p/${r.cover}.jpg`, bio: r.bio, traits: r.traits, favorites: r.favorites, stats,
    personality: r.personality, ownerId: r.owner, followers: r.followers, following: r.following, badgeIds: r.badges,
    neighbourhood: owners[r.owner].city, verified: r.verified, xp: r.xp,
  };
  owners[r.owner].petIds.push(r.id);
}

// ------------------------------------------------------------------ comments
const commentPool = [
  'The ears!! 😭', 'Protect this face at all costs', 'Biscuit says hi 👋', 'Boop secured', 'Playdate when??',
  'This is my whole personality now', 'Sending treats ✨', 'Main character energy', 'I would die for this pet',
  'We need a calendar of this', 'Okay but the TAIL', 'Look at that smile 🥹', 'Iconic behaviour', 'Fluff level: legendary',
  'Saw you at Larkspur yesterday!', 'Model behaviour 📸', 'Can confirm, very good', '10/10 would sniff', 'The drama 😂',
];
const commenterIds = Object.keys(pets).filter((p) => !['biscuit', 'juniper', 'mochi'].includes(p));
let cSeq = 0;
function comments(author: string, n: number, maxAge: number): Comment[] {
  const used = new Set<string>([author]);
  const out: Comment[] = [];
  for (let i = 0; i < n; i++) {
    let who = pick(commenterIds);
    for (let g = 0; g < 20 && used.has(who); g++) who = pick(commenterIds);
    used.add(who);
    out.push({ id: `c${++cSeq}`, authorPetId: who, text: pick(commentPool), createdAt: ago(Math.floor(rand() * maxAge * 0.9) + 2), likes: Math.floor(rand() * 60), likedByMe: false });
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ------------------------------------------------------------------ walks (needed by walk posts)
const walkRows: [string, string[], number, number, 'zoomies' | 'sniffy' | 'chill' | 'stubborn', string?][] = [
  ['w1', ['juniper', 'biscuit'], 1 * D + 2 * H, 42, 'zoomies', 'Juniper herded three spaniels and a jogger.'],
  ['w2', ['juniper'], 2 * D + 1 * H, 58, 'sniffy', 'Cedar Hollow loop. Every tree read in full.'],
  ['w3', ['biscuit'], 3 * D + 5 * H, 24, 'stubborn', 'Sat down in protest at the corner shop. Twice.'],
  ['w4', ['juniper', 'biscuit'], 4 * D, 51, 'chill', 'Golden hour at Larkspur.'],
  ['w5', ['juniper'], 5 * D + 3 * H, 66, 'zoomies'],
  ['w6', ['biscuit'], 6 * D + 2 * H, 31, 'sniffy'],
  ['w7', ['juniper', 'biscuit'], 8 * D, 47, 'chill'],
  ['w8', ['juniper'], 9 * D + 4 * H, 72, 'zoomies', 'Beach run! Sand everywhere.'],
  ['w9', ['biscuit'], 11 * D, 28, 'chill'],
  ['w10', ['juniper', 'biscuit'], 12 * D + 3 * H, 55, 'sniffy'],
  ['w-fig', ['fig'], 6 * H, 63, 'zoomies'],
  ['w-maple', ['maple', 'blue'], 26 * H, 88, 'zoomies'],
];
const walks: Walk[] = walkRows.map(([id, petIds, minutesAgo, mins, mood, note], i) => {
  const route = generateLoop(i + 3, 0.55 + mins / 90);
  const distanceKm = +(routeLength(route) / 420).toFixed(2);
  return {
    id, petIds, startedAt: ago(minutesAgo), durationSec: mins * 60, distanceKm,
    steps: Math.round(distanceKm * 1450), route, mood, note,
  };
});

// ------------------------------------------------------------------ posts
interface PostRow {
  pet: string; imgs: number[]; caption: string; ago: number; boops: number; loc?: string; c?: number; kind?: Post['kind'];
  with?: string[]; walk?: string; ms?: [string, string]; audio?: string; pack?: string; ai?: boolean;
}
const postRows: PostRow[] = [
  // my pets
  { pet: 'biscuit', imgs: [1213], caption: 'Strutting into the weekend like I own the pavement. (I do. I peed on it.) 🐾 #cavapoo #puppylife', ago: 55, boops: 842, loc: 'Maplewood High St', c: 6 },
  { pet: 'juniper', imgs: [1114], caption: 'Performance review for today’s walk: 9/10. Biscuit lost a point for chasing his own shadow. Again. #aussie #herdinglife', ago: 4 * H, boops: 2210, c: 5, ai: true },
  { pet: 'juniper', imgs: [1006], caption: 'Walked 4.2 km on Cedar Hollow. Rated every tree. Most were a 7.', ago: 2 * D + 30, boops: 1680, kind: 'walk', walk: 'w2', loc: 'Cedar Hollow Trail', c: 3 },
  { pet: 'mochi', imgs: [670], caption: 'tiny. fierce. currently plotting against the curtains 🐯', ago: 9 * H, boops: 1302, c: 4 },
  { pet: 'juniper', imgs: [520], caption: 'Zoomies are not a hobby, they are a lifestyle. ⚡️ #aussiesofsnoot', ago: 6 * D, boops: 3110, c: 4, kind: 'clip', audio: 'Original sound · juniper' },
  { pet: 'biscuit', imgs: [1258], caption: 'Autumn walk with the pack. Found 14 sticks. Kept 1. Proud of my restraint. 🍂', ago: 10 * D, boops: 960, loc: 'Larkspur Dog Park', c: 3, with: ['juniper'] },
  // community
  { pet: 'sunny', imgs: [574], caption: 'Waiting for Leo to finish his coffee so we can go to the beach. Patiently. Very patiently. Okay not that patiently.', ago: 25, boops: 9840, loc: 'Harbour Beach', c: 6 },
  { pet: 'bento', imgs: [533], caption: 'Do not speak to me before my second breakfast. 🍂 #shibainu #autumn', ago: 70, boops: 7210, c: 5 },
  { pet: 'nimbus', imgs: [82, 1253], caption: 'First snow forecast for Saturday ❄️ I have been training for this moment my entire life. Swipe for my happy place →', ago: 2 * H, boops: 6020, c: 4 },
  { pet: 'fig', imgs: [718], caption: 'Learned “tidy up” today. Now putting away toys so I can take them out again. Efficient. 🧠', ago: 3 * H + 10, boops: 4420, c: 4, pack: 'agility' },
  { pet: 'waffles', imgs: [667], caption: 'Pup cup review: Barkery & Brew. Whipped cream: 5 snorts. Ambience: 4 snorts. Staff ignored my sad face: -1 snort.', ago: 5 * H, boops: 3990, loc: 'Barkery & Brew', c: 5 },
  { pet: 'marmalade', imgs: [865], caption: 'it is my turn with the brain cell today. i am using it to nap.', ago: 6 * H, boops: 8840, c: 6 },
  { pet: 'pepper', imgs: [879], caption: 'Leaf pile inspection team reporting for duty 🍁🍁', ago: 8 * H, boops: 3550, loc: 'Larkspur Dog Park', c: 3 },
  { pet: 'clyde', imgs: [1174], caption: 'Case #4417: Someone ate the sandwich. Suspect: me. Evidence: also me. Case closed. 🕵️', ago: 11 * H, boops: 5120, c: 4 },
  { pet: 'ziggy', imgs: [1089], caption: 'Today’s documentary: The Hunt (for the red dot). Narrated by me, obviously. 🐆', ago: 14 * H, boops: 6100, c: 4 },
  { pet: 'dumpling', imgs: [1316], caption: 'Walked 40 metres. Was carried for the remaining 960. A perfect outing. 👑', ago: 18 * H, boops: 7770, c: 5 },
  { pet: 'kodiak', imgs: [795], caption: 'Field trip. Did not want to go home. Said so. Loudly. For 20 minutes. 🎤', ago: 22 * H, boops: 6900, c: 4, kind: 'clip', audio: 'AWOOO (remix) · kodiak' },
  { pet: 'tilly', imgs: [946], caption: 'Daisy inspector reporting: all daisies present and correct 🌼', ago: 26 * H, boops: 2780, c: 3 },
  { pet: 'pretzel', imgs: [1302], caption: 'Pumpkin spice and everything long. 🎃 #dachshund #autumnvibes', ago: 30 * H, boops: 6440, c: 5 },
  { pet: 'rusty', imgs: [258, 837], caption: 'Running through the forest like I’m in a shampoo commercial. Because I am one. 🍂', ago: 34 * H, boops: 4810, loc: 'Cedar Hollow Trail', c: 3 },
  { pet: 'luna', imgs: [184], caption: 'The snow has arrived and so have I ❄️', ago: 38 * H, boops: 3390, c: 3 },
  { pet: 'kiwi', imgs: [637], caption: '6:01 am kiss, as scheduled 💚', ago: 44 * H, boops: 4120, c: 3 },
  { pet: 'cocoa', imgs: [66], caption: 'When Amara says “last carrot” and you know it is not the last carrot 🥕', ago: 2 * D + 4 * H, boops: 3120, c: 3 },
  { pet: 'pharaoh', imgs: [679], caption: 'New jumper drop coming Friday. Pre-orders open (please, I’m cold).', ago: 2 * D + 9 * H, boops: 5220, c: 4 },
  { pet: 'earlgrey', imgs: [1113], caption: 'Posed for exactly one photo. You may have it. 🫖', ago: 3 * D, boops: 3880, c: 3 },
  { pet: 'spike', imgs: [755], caption: 'Huff. 🦔', ago: 3 * D + 6 * H, boops: 5560, c: 4 },
  { pet: 'sunny', imgs: [1217], caption: 'Seven years of being a good boy 🎂 Leo baked a peanut butter cake and I ate it in four seconds. Thank you for all the birthday boops!', ago: 4 * D, boops: 14200, kind: 'milestone', ms: ['🎂', 'Sunny turned 7'], c: 6 },
  { pet: 'blue', imgs: [392], caption: 'Spring flashback because it is cold and I miss the crocuses 🌸', ago: 4 * D + 5 * H, boops: 2440, c: 3 },
  { pet: 'maple', imgs: [287], caption: 'Summit smile. Theo needed a break at km 3. I did not.', ago: 26 * H, boops: 3770, kind: 'walk', walk: 'w-maple', loc: 'Cedar Hill Ridge', c: 3, with: ['blue'] },
  { pet: 'fig', imgs: [924], caption: 'Morning loop, 6.1 km. Did the hill twice for fun. 🏃‍♀️', ago: 6 * H, boops: 1880, kind: 'walk', walk: 'w-fig', loc: 'Willow Bend', c: 2 },
  { pet: 'oreo', imgs: [188], caption: 'blep', ago: 5 * D, boops: 4210, c: 3 },
  { pet: 'pistachio', imgs: [453], caption: 'Learned the microwave beep. Yuki has opened the microwave 11 times today. 😈', ago: 5 * D + 4 * H, boops: 2010, c: 3 },
  { pet: 'tiger', imgs: [551], caption: 'Stare contest champion, 9 years running.', ago: 6 * D, boops: 2770, c: 2 },
  { pet: 'neptune', imgs: [1211], caption: 'Wore my best gown for the tank clean 💙', ago: 6 * D + 8 * H, boops: 1660, c: 2 },
  { pet: 'kodiak', imgs: [1081], caption: 'Lake day. Swam. Shook. On Elena. 💦', ago: 7 * D, boops: 4400, loc: 'Silverpine Lake', c: 3 },
  { pet: 'sunny', imgs: [64], caption: 'Shake it off 💦 (sorry to everyone within 3 metres)', ago: 7 * D + 4 * H, boops: 11200, kind: 'clip', audio: 'Splash! · sunny', c: 5 },
  { pet: 'waffles', imgs: [880], caption: 'Leo’s flat white, my pup cup. Sunday ritual. ☕️', ago: 8 * D, boops: 1990, loc: 'Barkery & Brew', c: 2, with: ['sunny'] },
  { pet: 'nimbus', imgs: [1253], caption: 'Mountain mode activated 🏔️', ago: 9 * D, boops: 5630, c: 3 },
  { pet: 'bento', imgs: [1152], caption: 'Autumn road trip. I screamed at a leaf. The leaf deserved it.', ago: 10 * D, boops: 6010, kind: 'clip', audio: 'Shiba scream · bento', c: 4 },
  { pet: 'ziggy', imgs: [1310], caption: 'Leash adventure to the meadow. Saw a cow. We are now enemies.', ago: 11 * D, boops: 3330, c: 3 },
  { pet: 'pretzel', imgs: [1166], caption: 'Long road for a long boy.', ago: 12 * D, boops: 2900, c: 2 },
  { pet: 'cocoa', imgs: [521], caption: 'Lake check ✔️ Swim ✔️ Shake on Amara ✔️', ago: 13 * D, boops: 2600, kind: 'clip', audio: 'Lake vibes · cocoa', c: 2 },
  { pet: 'rusty', imgs: [268], caption: 'Wind in my ears, leaves in my fur.', ago: 14 * D, boops: 3900, c: 2 },
  { pet: 'marmalade', imgs: [882], caption: 'I have been informed it is not breakfast time. I disagree.', ago: 15 * D, boops: 7600, c: 4 },
];

const posts: Record<string, Post> = {};
postRows.forEach((r, i) => {
  const id = `p${i + 1}`;
  const n = r.c ?? 2;
  posts[id] = {
    id, petId: r.pet, kind: r.kind ?? 'photo', media: r.imgs.map((x) => photo(x)), aspect: r.kind === 'clip' ? '4:5' : aspectOf(r.imgs[0]),
    caption: r.caption, location: r.loc, createdAt: ago(r.ago), boops: r.boops, boopedByMe: i % 5 === 2,
    treats: Math.round(r.boops / 14), treatedByMe: false, savedByMe: i % 9 === 4, comments: comments(r.pet, n, r.ago),
    commentCount: n + Math.floor(r.boops / 260), withPetIds: r.with, walkId: r.walk,
    milestone: r.ms ? { emoji: r.ms[0], title: r.ms[1] } : undefined, audio: r.audio, packId: r.pack, aiAssisted: r.ai,
  };
});

// ------------------------------------------------------------------ stories
const storyRows: [string, number[], number][] = [
  ['sunny', [695, 574], 2], ['nimbus', [1253], 3], ['bento', [533, 1152], 4], ['fig', [924, 718], 5], ['waffles', [880, 1178], 6],
  ['kodiak', [1081], 7], ['marmalade', [865], 8], ['ziggy', [1310, 1089], 9], ['pretzel', [1302], 12], ['spike', [755], 14], ['luna', [184], 16], ['clyde', [1141], 18],
];
const stickers = ['Zoomies o’clock ⚡️', 'Rate my nap 1–10', '📍 Larkspur', 'Snack time 🦴', 'Good morning!', '', ''];
const stories: Story[] = storyRows.map(([petId, imgs, hrs], i) => ({
  id: `s${i + 1}`, petId, seenUpTo: i >= 9 ? imgs.length : 0,
  items: imgs.map((n, j) => ({ id: `s${i + 1}-${j}`, media: photo(n), createdAt: ago(hrs * H - j * 25), sticker: stickers[(i + j) % stickers.length] || undefined })),
}));

// ------------------------------------------------------------------ places (map is 1000×700)
const placeRows: Omit<Place, 'checkedInToday' | 'saved' | 'reviews'>[] = [
  { id: 'larkspur', name: 'Larkspur Dog Park', category: 'park', x: 300, y: 250, address: '12 Larkspur Ave', rating: 4.8, reviewCount: 412, hours: '6am – 10pm', openNow: true, amenities: ['Off-leash', 'Water fountain', 'Agility area', 'Small-dog zone'], photo: photo(1258), description: 'Two fenced acres with a separate small-dog zone, agility equipment and the best sunset bench in Maplewood.', checkIns: 1820 },
  { id: 'willow', name: 'Willow Bend Off-Leash', category: 'park', x: 640, y: 170, address: 'River Rd & Willow St', rating: 4.6, reviewCount: 233, hours: 'Open 24 hours', openNow: true, amenities: ['Off-leash', 'River access', 'Poop bags'], photo: photo(924), description: 'Rolling hills along the river bend. Popular with retrievers who believe they are ducks.', checkIns: 1104 },
  { id: 'cedar', name: 'Cedar Hollow Trail', category: 'trail', x: 845, y: 300, address: 'Trailhead, Cedar Hill Rd', rating: 4.9, reviewCount: 518, hours: 'Dawn – dusk', openNow: true, amenities: ['On-leash', '5.4 km loop', 'Shade', 'Creek'], photo: photo(1006), description: 'A shady 5.4 km loop through old cedars with a creek crossing halfway. Muddy after rain, magical in autumn.', checkIns: 2310 },
  { id: 'harbour', name: 'Harbour Beach', category: 'beach', x: 560, y: 625, address: 'Harbour Promenade', rating: 4.7, reviewCount: 389, hours: 'Dogs welcome before 10am & after 6pm', openNow: false, amenities: ['Seasonal hours', 'Rinse station', 'Off-leash zone'], photo: photo(695), description: 'Sandy cove with an off-leash zone at either end of the day. Rinse station by the lifeguard hut.', checkIns: 1640 },
  { id: 'mapleanimal', name: 'Maplewood Animal Hospital', category: 'vet', x: 480, y: 300, address: '88 Elm Street', rating: 4.7, reviewCount: 201, hours: 'Open 24/7 for emergencies', openNow: true, amenities: ['24/7 emergency', 'Exotics', 'Cat-only waiting room'], description: 'Full-service hospital with an emergency team on site around the clock and a separate calm room for cats.', checkIns: 320, phone: '(555) 014-2210', partner: true,
    offer: { id: 'o-vet', title: 'Free nail trim with any check-up', detail: 'Show the code at reception.', cost: 120 } },
  { id: 'gentle', name: 'Gentle Paws Vet Clinic', category: 'vet', x: 735, y: 455, address: '5 Orchard Lane', rating: 4.9, reviewCount: 156, hours: '8am – 7pm', openNow: true, amenities: ['Fear-free certified', 'House calls', 'Dental'], description: 'Fear-free certified clinic: treats, slow introductions and zero rushing.', checkIns: 190, phone: '(555) 014-8812' },
  { id: 'goodboy', name: 'The Good Boy Supply Co.', category: 'store', x: 380, y: 425, address: '41 High Street', rating: 4.6, reviewCount: 274, hours: '9am – 8pm', openNow: true, priceLevel: 2, amenities: ['Treat bar', 'Self-wash station', 'Local makers'], photo: photo(1098), description: 'Independent pet store with a self-serve treat bar, locally made toys and a self-wash bay in the back.', checkIns: 980, partner: true,
    offer: { id: 'o-goodboy', title: '15% off your next order', detail: 'In store or online, one use.', cost: 200 } },
  { id: 'whisker', name: 'Whisker & Wag Market', category: 'store', x: 615, y: 365, address: '220 Mill Road', rating: 4.4, reviewCount: 182, hours: '10am – 7pm', openNow: true, priceLevel: 2, amenities: ['Cat specialists', 'Raw food', 'Adoption corner'], photo: photo(1138), description: 'Cat-forward shop with a weekend adoption corner run by Maplewood Rescue.', checkIns: 640, partner: true,
    offer: { id: 'o-whisker', title: 'Free toy with any purchase', detail: 'While stocks last.', cost: 80 } },
  { id: 'suds', name: 'Suds & Snoots Grooming', category: 'groomer', x: 245, y: 470, address: '9 Baker Lane', rating: 4.8, reviewCount: 143, hours: '9am – 6pm', openNow: true, priceLevel: 2, amenities: ['Doodle specialists', 'Cat grooming', 'Pick-up service'], description: 'Calm, unhurried grooming with doodle coats a speciality. Blueberry facial included.', checkIns: 410, partner: true,
    offer: { id: 'o-suds', title: 'Free blueberry facial', detail: 'Add-on with any full groom.', cost: 90 } },
  { id: 'fluff', name: 'Fluff Atelier', category: 'groomer', x: 815, y: 530, address: '67 Harbour Row', rating: 4.5, reviewCount: 98, hours: '10am – 6pm', openNow: false, priceLevel: 3, amenities: ['Hand scissoring', 'Spa bath'], description: 'Boutique grooming studio with hand-scissored finishes.', checkIns: 210 },
  { id: 'barkery', name: 'Barkery & Brew', category: 'cafe', x: 450, y: 480, address: '14 Market Square', rating: 4.9, reviewCount: 601, hours: '7am – 6pm', openNow: true, priceLevel: 1, amenities: ['Pup cups', 'Dog bakery', 'Water bowls', 'Patio'], photo: photo(880), description: 'Coffee for you, peanut-butter pup cups and birthday cakes for them. The patio is basically a dog park with croissants.', checkIns: 3120, partner: true,
    offer: { id: 'o-barkery', title: 'Free pup cup', detail: 'With any drink.', cost: 50 } },
  { id: 'patio', name: 'Patio 41', category: 'cafe', x: 690, y: 270, address: '41 Riverside Walk', rating: 4.5, reviewCount: 318, hours: '11am – 11pm', openNow: true, priceLevel: 2, amenities: ['Dog menu', 'Heated patio', 'Water bowls'], photo: photo(1178), description: 'Riverside restaurant with a heated patio and a short dog menu (the chicken & rice is a hit).', checkIns: 870 },
  { id: 'biscuitbakery', name: 'Crumb & Co. Pet Bakery', category: 'cafe', x: 360, y: 330, address: '3 Larkspur Ave', rating: 4.8, reviewCount: 220, hours: '8am – 4pm', openNow: true, priceLevel: 1, amenities: ['Custom cakes', 'Grain-free', 'Gift boxes'], photo: photo(1217), description: 'Bakery making custom pet birthday cakes, pupcakes and gotcha-day gift boxes.', checkIns: 760, partner: true,
    offer: { id: 'o-crumb', title: '20% off a birthday cake', detail: 'Order 48 hours ahead.', cost: 150 } },
  { id: 'sithappens', name: 'Sit Happens Training', category: 'trainer', x: 905, y: 185, address: '2 Barn Road', rating: 4.9, reviewCount: 131, hours: 'Classes Tue–Sun', openNow: true, priceLevel: 2, amenities: ['Puppy classes', 'Reactive dogs', 'Indoor arena'], description: 'Positive-reinforcement classes from puppy manners to reactive-dog confidence.', checkIns: 260 },
  { id: 'agility', name: 'Maplewood Agility Yard', category: 'trainer', x: 145, y: 345, address: 'Field 3, Westgate', rating: 4.7, reviewCount: 88, hours: 'Weekends', openNow: false, amenities: ['Full agility course', 'Drop-in sessions'], photo: photo(1310), description: 'Weekend drop-in agility on a full competition course.', checkIns: 330 },
];
const reviewTexts = ['Our favourite spot — staff remember everyone’s name.', 'Clean, friendly and the treats are top tier.', 'A bit busy on weekends but worth it.', 'Juniper would move in if allowed.', 'Calm atmosphere, very patient with nervous dogs.'];
const places: Place[] = placeRows.map((p, i) => ({
  ...p, checkedInToday: false, saved: i === 0 || i === 10,
  reviews: [0, 1, 2].map((k) => ({ id: `${p.id}-r${k}`, ownerId: pick(Object.keys(owners).filter((o) => o !== 'maya')), rating: k === 2 ? 4 : 5, text: reviewTexts[(i + k) % reviewTexts.length], createdAt: ago((k + 1) * 3 * D + i * 60) })),
}));

// ------------------------------------------------------------------ events
const ev = (e: Omit<PetEvent, 'rsvp'> & { rsvp?: PetEvent['rsvp'] }): PetEvent => ({ rsvp: null, ...e });
const events: PetEvent[] = [
  ev({ id: 'e1', title: 'Saturday Sniffari Pack Walk', category: 'meetup', start: inDays(1, 9), end: inDays(1, 11), placeId: 'cedar', cover: photo(1141), host: 'Sniffari Walkers', packId: 'sniffari', description: 'A relaxed 5 km social walk around Cedar Hollow. All paces welcome — the slow sniffers set the speed. Coffee at the trailhead afterwards.', going: 38, interested: 64, price: 0, tags: ['All breeds', 'On-leash', 'Social'], attendeePetIds: ['clyde', 'rusty', 'maple', 'blue', 'cocoa', 'fig'], rsvp: 'going' }),
  ev({ id: 'e2', title: 'Adoption Day: Maplewood Rescue', category: 'adoption', start: inDays(2, 11), end: inDays(2, 16), placeId: 'whisker', cover: photo(1165), host: 'Maplewood Rescue', description: 'Meet 20+ adoptable cats and dogs. Volunteers on hand for meet-and-greets, and every adoption comes with a starter kit from Whisker & Wag.', going: 112, interested: 240, price: 0, tags: ['Adoption', 'Family friendly'], attendeePetIds: ['tiger', 'luna'] }),
  ev({ id: 'e3', title: 'Agility Fun Cup', category: 'competition', start: inDays(3, 10), end: inDays(3, 15), placeId: 'agility', cover: photo(718), host: 'Maplewood Agility Yard', packId: 'agility', description: 'Friendly agility competition with beginner, intermediate and “chaos” categories. Medals for everyone, trophies for the fastest.', going: 46, interested: 90, price: 12, tags: ['Competition', 'Dogs'], attendeePetIds: ['fig', 'juniper', 'blue'], capacity: 60, species: ['dog'] }),
  ev({ id: 'e4', title: 'Yappy Hour on the Patio', category: 'party', start: inDays(4, 18), end: inDays(4, 21), placeId: 'patio', cover: photo(1306), host: 'Patio 41', description: 'Half-price drinks for humans, free puppuccinos for dogs and a heated patio. Live acoustic set from 7pm.', going: 74, interested: 132, price: 0, tags: ['Social', '18+ humans'], attendeePetIds: ['waffles', 'sunny', 'pepper', 'cocoa'] }),
  ev({ id: 'e5', title: 'Puppy Manners 101', category: 'training', start: inDays(5, 17, 30), end: inDays(5, 18, 30), placeId: 'sithappens', cover: photo(1213), host: 'Sit Happens Training', description: 'Six-week course covering loose-lead walking, recall, settle and polite greetings. Small groups of six.', going: 5, interested: 22, price: 140, tags: ['Puppies', 'Course'], attendeePetIds: ['biscuit'], capacity: 6, species: ['dog'], rsvp: 'interested' }),
  ev({ id: 'e6', title: 'Cat Café Social', category: 'meetup', start: inDays(6, 14), end: inDays(6, 16), placeId: 'whisker', cover: photo(1113), host: 'Cat Loaf Society', packId: 'catloaf', description: 'Bring your harness-trained cat (or just yourself) for tea, enrichment demos and a talk on indoor cat happiness.', going: 29, interested: 77, price: 5, tags: ['Cats', 'Indoor'], attendeePetIds: ['ziggy', 'earlgrey'], species: ['cat'] }),
  ev({ id: 'e7', title: 'Maplewood Winter Pet Show', category: 'show', start: inDays(9, 11), end: inDays(9, 17), placeId: 'larkspur', cover: photo(82), host: 'Maplewood Council', description: 'Categories for waggiest tail, best trick, most festive outfit and goodest senior. Food trucks and a photo booth with snow machine.', going: 203, interested: 410, price: 0, tags: ['Show', 'Family friendly', 'Costumes'], attendeePetIds: ['nimbus', 'dumpling', 'tilly', 'pretzel', 'sunny'] }),
  ev({ id: 'e8', title: 'Frosty Paws 5K', category: 'competition', start: inDays(13, 9), end: inDays(13, 12), placeId: 'willow', cover: photo(795), host: 'Snoot × Willow Bend', description: 'A charity 5K for you and your dog along the river. Every finisher gets a medal, a bandana and 200 Treats on Snoot.', going: 156, interested: 300, price: 20, tags: ['Charity', 'Running'], attendeePetIds: ['kodiak', 'maple', 'fig', 'rusty'], species: ['dog'] }),
  ev({ id: 'e9', title: 'Senior Pets Brunch', category: 'party', start: inDays(15, 11), end: inDays(15, 13), placeId: 'barkery', cover: photo(1316), host: 'Senior & Sweet', packId: 'seniors', description: 'Slow brunch for pets aged 8+ and their humans. Soft treats, comfy mats and a vet Q&A on healthy ageing.', going: 31, interested: 58, price: 8, tags: ['Seniors', 'Calm'], attendeePetIds: ['dumpling', 'tiger', 'clyde'] }),
  ev({ id: 'e10', title: 'Pawliday Photo Booth', category: 'party', start: inDays(19, 12), end: inDays(19, 17), placeId: 'goodboy', cover: photo(1044), host: 'The Good Boy Supply Co.', description: 'Festive portraits with a pro photographer. Proceeds go to Maplewood Rescue.', going: 88, interested: 190, price: 15, tags: ['Photos', 'Charity'], attendeePetIds: ['marmalade', 'tilly', 'pretzel'] }),
];

// ------------------------------------------------------------------ packs
const packs: Pack[] = [
  { id: 'sniffari', name: 'Sniffari Walkers', tagline: 'Slow walks, long sniffs', description: 'A walking group for dogs who believe the walk is about the smells, not the distance. Weekly pack walks around Maplewood.', cover: photo(1141), icon: '🐾', color: '#4f9a82', members: 1284, joined: true, tags: ['Walking', 'All breeds'], memberPetIds: ['clyde', 'rusty', 'maple', 'cocoa', 'juniper'], rules: ['Leads on at the trailhead', 'Let sniffers sniff', 'Pick up after your pup'] },
  { id: 'aussie', name: 'Aussie Gang', tagline: 'Herders, zoomers, side-eyers', description: 'For Australian Shepherds and the people they manage. Trail meetups, herding tips and merle appreciation.', cover: photo(520), icon: '🐑', color: '#9a654f', members: 3420, joined: true, tags: ['Breed', 'Dogs'], memberPetIds: ['juniper', 'maple', 'blue'], rules: ['Merle photos encouraged', 'Be kind to beginners'] },
  { id: 'catloaf', name: 'Cat Loaf Society', tagline: 'Purveyors of fine loaves', description: 'Indoor cat enrichment, loaf ratings and harness adventures.', cover: photo(865), icon: '🍞', color: '#9a834f', members: 5810, joined: false, tags: ['Cats'], memberPetIds: ['marmalade', 'earlgrey', 'luna', 'oreo', 'tiger', 'pharaoh', 'ziggy'], rules: ['All loaves are valid', 'No spray bottles talk'] },
  { id: 'agility', name: 'Agility Addicts', tagline: 'Weave poles are a lifestyle', description: 'Training tips, course maps and competition meetups.', cover: photo(718), icon: '🏅', color: '#4f669a', members: 980, joined: false, tags: ['Sport', 'Training'], memberPetIds: ['fig', 'juniper', 'blue'], rules: ['Positive training only'] },
  { id: 'smallpaws', name: 'Small Paws Club', tagline: 'Big personalities under 10 kg', description: 'Small-dog meetups in the small-dog zone. No judgment for bike-basket rides.', cover: photo(946), icon: '🎀', color: '#9a4f77', members: 2210, joined: false, tags: ['Small dogs'], memberPetIds: ['tilly', 'dumpling', 'biscuit', 'pretzel', 'waffles'], rules: ['Small-dog zone only for meetups'] },
  { id: 'seniors', name: 'Senior & Sweet', tagline: 'Grey muzzles, warm hearts', description: 'Support, tips and gentle meetups for senior pets and their humans.', cover: photo(1174), icon: '🤍', color: '#624f9a', members: 1560, joined: false, tags: ['Seniors', 'Support'], memberPetIds: ['dumpling', 'tiger', 'clyde', 'sunny'], rules: ['Be gentle', 'Share vet tips, not diagnoses'] },
  { id: 'rescue', name: 'Rescue Pride', tagline: 'Adopted & adored', description: 'Gotcha-day stories, foster updates and adoption-event volunteers.', cover: photo(1165), icon: '🏡', color: '#4f9a6b', members: 4100, joined: false, tags: ['Adoption', 'Volunteer'], memberPetIds: ['juniper', 'cocoa', 'luna'], rules: ['Adopt, foster, support'] },
  { id: 'birbs', name: 'Birb Nerds', tagline: 'Chirp chirp, bonjour', description: 'Parrots, budgies, lovebirds and the humans they wake up at dawn.', cover: photo(637), icon: '🦜', color: '#4f9a81', members: 860, joined: false, tags: ['Birds'], memberPetIds: ['kiwi', 'pistachio'], rules: ['No clipped-wing debates'] },
];

// ------------------------------------------------------------------ messages
let mSeq = 0;
const msg = (senderPetId: string, text: string, minutesAgo: number, extra: { postId?: string; eventId?: string } = {}) => ({ id: `m${++mSeq}`, senderPetId, text, createdAt: ago(minutesAgo), ...extra });
const conversations: Conversation[] = [
  { id: 'dm1', withPetId: 'fig', unread: true, messages: [
    msg('juniper', 'Are you doing the Agility Fun Cup on Thursday?', 6 * H), msg('fig', 'Obviously. I’ve been practising the weave poles in my sleep.', 5 * H + 40),
    msg('fig', 'Want to train together Wednesday at the Yard?', 40) ] },
  { id: 'dm2', withPetId: 'sunny', unread: true, messages: [
    msg('sunny', 'Biscuit!! Beach before 10 tomorrow? 🌊', 3 * H), msg('biscuit', 'YES. Will bring sock.', 2 * H + 50), msg('sunny', 'Perfect. Bring two.', 15) ] },
  { id: 'dm3', withPetId: 'waffles', unread: false, messages: [
    msg('waffles', 'Have you tried the new pumpkin pup cup?', 1 * D + 2 * H, { postId: 'p11' }), msg('biscuit', 'Not yet 😱 is it good?', 1 * D + H), msg('waffles', 'Five snorts. Life changing.', 1 * D) ] },
  { id: 'dm4', withPetId: 'marmalade', unread: false, messages: [
    msg('mochi', 'how do you get to the top of the fridge', 2 * D), msg('marmalade', 'you don’t. the fridge comes to you.', 2 * D - 30), msg('mochi', 'wow', 2 * D - 29) ] },
  { id: 'dm5', withPetId: 'clyde', unread: false, messages: [
    msg('clyde', 'See you at the Sniffari walk Saturday?', 3 * D, { eventId: 'e1' }), msg('juniper', 'Wouldn’t miss it. Please walk faster this time.', 3 * D - 40), msg('clyde', 'No.', 3 * D - 39) ] },
];

// ------------------------------------------------------------------ notifications
let nSeq = 0;
const nt = (type: AppNotification['type'], text: string, minutesAgo: number, petId?: string, postId?: string, read = true, href?: string): AppNotification => ({ id: `n${++nSeq}`, type, text, petId, postId, createdAt: ago(minutesAgo), read, href });
const notifications: AppNotification[] = [
  nt('boop', 'booped your post', 12, 'sunny', 'p1', false),
  nt('treat', 'sent Biscuit 3 treats', 35, 'nimbus', 'p1', false),
  nt('comment', 'commented: “Playdate when??”', 50, 'waffles', 'p1', false),
  nt('playdate', 'is a 94% PawMatch with Biscuit — say hi?', 2 * H, 'tilly', undefined, false, '/discover'),
  nt('lost', 'Lost pet alert 0.8 km away: Smudge (grey cat)', 3 * H, undefined, undefined, false, '/lost'),
  nt('follow', 'started following Juniper', 5 * H, 'fig'),
  nt('badge', 'Juniper earned the “Rain or Shine” badge', 9 * H, 'juniper', undefined, true, '/rewards'),
  nt('event', 'Saturday Sniffari Pack Walk starts tomorrow at 9:00', 20 * H, undefined, undefined, true, '/events/e1'),
  nt('birthday', 'Biscuit’s 1st birthday is in 2 weeks — plan a pawty?', 1 * D, 'biscuit', undefined, true, '/pet/biscuit?tab=memories'),
  nt('contest', 'Juniper is #3 in “Sleepiest Pose” — 2 days left', 2 * D, 'juniper', undefined, true, '/contests'),
  nt('boop', 'booped Juniper’s walk', 2 * D + 3 * H, 'maple', 'p3'),
  nt('follow', 'started following Mochi', 3 * D, 'marmalade'),
];

// ------------------------------------------------------------------ memories, diary, albums
let memSeq = 0;
const mem = (petId: string, dateIso: string, type: Memory['type'], emoji: string, title: string, note: string, img?: number): Memory =>
  ({ id: `mem${++memSeq}`, petId, date: dateIso, type, emoji, title, note, media: img ? photo(img) : undefined });
const memories: Memory[] = [
  mem('biscuit', ago(330 * D), 'milestone', '🏡', 'Gotcha day', 'Came home in a laundry basket. Fell asleep on Maya’s foot within 4 minutes.', 1213),
  mem('biscuit', ago(300 * D), 'first', '🦴', 'First chew toy destroyed', 'The squeaky hedgehog lasted 11 minutes. RIP Gerald.'),
  mem('biscuit', ago(240 * D), 'first', '🌊', 'First time at the beach', 'Barked at a wave. The wave won.', 695),
  mem('biscuit', ago(120 * D), 'health', '💉', 'All vaccinations done', 'Officially allowed in the big-dog park. Very brave (cried a bit).'),
  mem('biscuit', ago(40 * D), 'adventure', '🍂', 'First autumn', 'Discovered leaf piles. Life has changed.', 1258),
  mem('biscuit', ago(10 * D), 'milestone', '🎓', 'Learned “paw”', 'Now offers paw for everything, including when told “no”.'),
  mem('juniper', ago(4 * 365 * D), 'milestone', '🏡', 'Gotcha day', 'Adopted from Maplewood Rescue at 12 weeks. Herded the car seat on the way home.'),
  mem('juniper', ago(3 * 365 * D), 'first', '🥏', 'First frisbee catch', 'Caught it on the first try and has not stopped since.'),
  mem('juniper', ago(2 * 365 * D), 'adventure', '🏔️', 'Cedar Hill summit', 'Her first big hike — 12 km and still wanted more.', 1006),
  mem('juniper', ago(400 * D), 'milestone', '🏅', 'Agility beginner ribbon', 'Second place. Would have been first if not for a very interesting smell.'),
  mem('juniper', ago(330 * D), 'milestone', '🐶', 'Became a big sister', 'Met Biscuit. Started herding him immediately.'),
  mem('juniper', ago(30 * D), 'adventure', '🌊', 'Beach run', 'First off-season run on Harbour Beach.', 520),
  mem('mochi', ago(150 * D), 'milestone', '🏡', 'Gotcha day', 'Found under a car at 6 weeks old, the size of a mango.'),
  mem('mochi', ago(90 * D), 'first', '🧶', 'First zoomies', '3am. Through the kitchen, over Biscuit, into the curtains.'),
  mem('mochi', ago(20 * D), 'first', '🧊', 'Reached the top of the fridge', 'Nobody knows how. She will not tell us.', 670),
];
const diary: DiaryEntry[] = [
  { id: 'd1', petId: 'biscuit', date: ago(1 * D), mood: 'happy', text: 'Dear diary, today I found a sock under the sofa. It was not my sock. It is my sock now. Also, Juniper tried to herd me into the bath. I escaped. Victory.', aiWritten: true },
  { id: 'd2', petId: 'biscuit', date: ago(3 * D), mood: 'grumpy', text: 'Went to the vet. They took my temperature in a way I did not consent to. Got a treat. Am considering forgiveness.' },
  { id: 'd3', petId: 'biscuit', date: ago(6 * D), mood: 'zoomies', text: 'Zoomies at 7pm. Knocked over a plant. The plant had it coming.' },
  { id: 'd4', petId: 'juniper', date: ago(1 * D), mood: 'curious', text: 'New dog moved in on Elm Street. Have not yet decided whether he is an employee or a competitor. Will observe.', aiWritten: true },
  { id: 'd5', petId: 'juniper', date: ago(4 * D), mood: 'loved', text: 'Maya sat on the floor with me for an hour after work. Did not throw anything. Was still the best part of the day.' },
  { id: 'd6', petId: 'mochi', date: ago(2 * D), mood: 'zoomies', text: 'ATTACKED THE CURTAINS. WON. CURTAINS NOW HAVE HOLES. NAP TIME.', aiWritten: true },
];
const albums: Album[] = [
  { id: 'al1', title: 'The Maplewood Pack', petIds: ['biscuit', 'juniper', 'sunny', 'waffles'], contributorIds: ['maya', 'leo', 'sam'], media: [1258, 574, 667, 1213, 880, 695].map((x) => photo(x)), updatedAt: ago(2 * D) },
  { id: 'al2', title: 'Juniper’s Trail Log', petIds: ['juniper'], contributorIds: ['maya'], media: [1006, 1114, 924, 520, 1141].map((x) => photo(x)), updatedAt: ago(5 * D) },
  { id: 'al3', title: 'Mochi: Tiny Era', petIds: ['mochi'], contributorIds: ['maya', 'mia'], media: [670, 1212, 865].map((x) => photo(x)), updatedAt: ago(9 * D) },
];

// ------------------------------------------------------------------ badges, challenges, contests
const badges: Badge[] = [
  { id: 'first-boop', name: 'First Boop', description: 'Received your first boop.', icon: '👃', color: '#9a654f', tier: 'bronze' },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Made 25 pet friends.', icon: '🦋', color: '#624f9a', tier: 'silver' },
  { id: 'trailblazer', name: 'Trailblazer', description: 'Completed 10 walks.', icon: '🥾', color: '#4f9a82', tier: 'bronze' },
  { id: '100km', name: '100 km Club', description: 'Walked 100 km in total.', icon: '💯', color: '#4f669a', tier: 'gold' },
  { id: 'explorer', name: 'Explorer', description: 'Checked in at 5 different places.', icon: '🧭', color: '#9a7e4f', tier: 'silver' },
  { id: 'streak-7', name: 'Week Streak', description: 'Opened Snoot 7 days in a row.', icon: '🔥', color: '#9a544f', tier: 'bronze' },
  { id: 'early-riser', name: 'Early Riser', description: 'Five walks before 8am.', icon: '🌅', color: '#9a854f', tier: 'bronze' },
  { id: 'rain-or-shine', name: 'Rain or Shine', description: 'Walked on 3 rainy days.', icon: '☔️', color: '#4f839a', tier: 'silver' },
  { id: 'pack-leader', name: 'Pack Leader', description: 'Organised a pack meetup.', icon: '👑', color: '#664f9a', tier: 'gold' },
  { id: 'birthday-star', name: 'Birthday Star', description: 'Celebrated a birthday on Snoot.', icon: '🎂', color: '#9a4f77', tier: 'bronze' },
  { id: 'photogenic', name: 'Photogenic', description: 'Reached a contest final.', icon: '📸', color: '#9a4f74', tier: 'silver' },
  { id: 'snack-connoisseur', name: 'Snack Connoisseur', description: 'Checked in at 3 pet bakeries.', icon: '🧁', color: '#9a714f', tier: 'bronze' },
  { id: 'good-neighbour', name: 'Good Neighbour', description: 'Reported a sighting for a lost pet.', icon: '🤝', color: '#4f9a6b', tier: 'silver' },
  { id: 'rescue-hero', name: 'Rescue Hero', description: 'Supported an adoption event.', icon: '🏡', color: '#4f9a81', tier: 'gold' },
  { id: 'night-owl', name: 'Night Owl', description: 'Walked under the stars 5 times.', icon: '🌙', color: '#4f519a', tier: 'bronze' },
  { id: 'legend', name: 'Neighbourhood Legend', description: 'Reached level 30.', icon: '🌟', color: '#9a884f', tier: 'legend' },
];
const challenges: Challenge[] = [
  { id: 'ch1', title: 'November 50', description: 'Walk 50 km before the month ends.', icon: '🥾', goal: 50, unit: 'km', progress: 0, reward: 300, endsAt: inDays(8, 23), joined: true, participants: 4120, color: '#4f9a82' },
  { id: 'ch2', title: 'Park Hopper', description: 'Check in at 3 different parks.', icon: '🌳', goal: 3, unit: 'parks', progress: 1, reward: 120, endsAt: inDays(12, 23), joined: true, participants: 1880, color: '#4f9a6b' },
  { id: 'ch3', title: 'Five-Day Storyteller', description: 'Post 5 days in a row.', icon: '📸', goal: 5, unit: 'days', progress: 3, reward: 150, endsAt: inDays(6, 23), joined: true, participants: 2930, color: '#9a654f' },
  { id: 'ch4', title: 'Snow Day Snap', description: 'Share a photo of your pet in the first snow.', icon: '❄️', goal: 1, unit: 'photo', progress: 0, reward: 80, endsAt: inDays(20, 23), joined: false, participants: 960, color: '#4f839a' },
  { id: 'ch5', title: 'Make Three Friends', description: 'Arrange 3 playdates through PawMatch.', icon: '🤝', goal: 3, unit: 'playdates', progress: 0, reward: 200, endsAt: inDays(25, 23), joined: false, participants: 740, color: '#624f9a' },
];
const entry = (id: string, petId: string, n: number, votes: number) => ({ id, petId, media: photo(n), votes });
const contests: Contest[] = [
  { id: 'ct1', title: 'Sleepiest Pose', theme: 'Show us the most dramatic nap position in the household.', cover: photo(865), endsAt: inDays(2, 20), prize: '500 Treats + a Crumb & Co. cake', color: '#624f9a',
    entries: [entry('ce1', 'marmalade', 865, 1840), entry('ce2', 'pharaoh', 679, 1210), entry('ce3', 'juniper', 1114, 1102), entry('ce4', 'dumpling', 1316, 980), entry('ce5', 'clyde', 1174, 870), entry('ce6', 'tiger', 551, 640)], enteredPetId: 'juniper' },
  { id: 'ct2', title: 'Autumn Glamour', theme: 'Leaves, light and your most photogenic pet.', cover: photo(1302), endsAt: inDays(6, 20), prize: '800 Treats + Good Boy Supply Co. hamper', color: '#9a714f',
    entries: [entry('ce7', 'pretzel', 1302, 2240), entry('ce8', 'pepper', 879, 1930), entry('ce9', 'bento', 533, 1880), entry('ce10', 'rusty', 258, 1460), entry('ce11', 'biscuit', 1258, 990)], enteredPetId: 'biscuit' },
  { id: 'ct3', title: 'Best Smile', theme: 'The happiest face in Maplewood.', cover: photo(574), endsAt: ago(3 * D), prize: '1,000 Treats', color: '#9a834f',
    entries: [entry('ce12', 'sunny', 574, 4120), entry('ce13', 'nimbus', 82, 3980), entry('ce14', 'maple', 287, 2010), entry('ce15', 'cocoa', 66, 1500)] },
];

// ------------------------------------------------------------------ lost & found, adoption
const lost: LostAlert[] = [
  { id: 'l1', petName: 'Smudge', species: 'cat', breed: 'Grey domestic shorthair', photo: photo(654), lastSeen: 'Near Orchard Lane, by the bakery bins', x: 700, y: 430, createdAt: ago(3 * H), status: 'lost', reporterOwnerId: 'lena', description: 'Indoor cat, slipped out of a window. Shy but food motivated. Grey with a white chin. Microchipped.', reward: 100, sightings: 2, contact: '(555) 014-7781' },
  { id: 'l2', petName: 'Tank', species: 'dog', breed: 'English Bulldog', photo: photo(1001), lastSeen: 'Willow Bend, near the river path', x: 610, y: 205, createdAt: ago(20 * H), status: 'lost', reporterOwnerId: 'kenji', description: 'Friendly but slow, red collar with a bone tag. Answers to “Tank” or the sound of a crisp packet.', sightings: 5, contact: '(555) 014-3349' },
  { id: 'l3', petName: 'Noodle', species: 'dog', breed: 'Miniature Dachshund', photo: photo(500), lastSeen: 'Larkspur Dog Park, small-dog zone', x: 320, y: 270, createdAt: ago(2 * D), status: 'found', reporterOwnerId: 'ava', description: 'Found safe thanks to two Snoot neighbours! Thank you all 🧡', sightings: 7, contact: '(555) 014-5520' },
  { id: 'l4', petName: 'Bruiser', species: 'dog', breed: 'French Bulldog mix', photo: photo(587), lastSeen: 'Harbour Promenade', x: 540, y: 590, createdAt: ago(4 * D), status: 'found', reporterOwnerId: 'sam', description: 'Reunited with his family the same evening.', sightings: 3, contact: '(555) 014-1102' },
];
const adoption: AdoptionPet[] = [
  { id: 'a1', name: 'Rio', species: 'dog', breed: 'Shepherd mix', ageLabel: '2 years', sex: 'boy', size: 'medium', photo: photo(1165), shelter: 'Maplewood Rescue', distanceKm: 1.2, traits: ['Playful', 'Smart', 'Loves fetch'], story: 'Rio was found wandering near the docks. He’s a fast learner who already knows sit, down and “wait” — and would love an active family.', goodWith: ['Dogs', 'Older kids'], favorite: false, applied: false, daysWaiting: 34 },
  { id: 'a2', name: 'Hazel', species: 'dog', breed: 'Cocker Spaniel', ageLabel: '6 years', sex: 'girl', size: 'medium', photo: photo(870), shelter: 'Harbourside Animal Shelter', distanceKm: 3.4, traits: ['Gentle', 'Calm', 'Lap dog'], story: 'Hazel’s owner moved into care. She’s calm indoors, loves a slow walk and would be the perfect companion for a quiet home.', goodWith: ['Cats', 'Kids', 'Dogs'], favorite: true, applied: false, daysWaiting: 61 },
  { id: 'a3', name: 'Olive', species: 'cat', breed: 'Tabby', ageLabel: '1 year', sex: 'girl', size: 'small', photo: photo(495), shelter: 'Whisker & Wag Adoption Corner', distanceKm: 0.9, traits: ['Curious', 'Window watcher', 'Chatty'], story: 'Olive spends her days narrating the birds outside. She’s affectionate once she knows you and loves a high perch.', goodWith: ['Adults', 'Calm dogs'], favorite: false, applied: false, daysWaiting: 18 },
  { id: 'a4', name: 'Copper', species: 'dog', breed: 'Vizsla', ageLabel: '3 years', sex: 'boy', size: 'large', photo: photo(203), shelter: 'Maplewood Rescue', distanceKm: 1.2, traits: ['Velcro dog', 'Runner', 'Affectionate'], story: 'Copper is a cuddle machine who needs daily runs. He’d thrive with an outdoorsy human and a sofa he’s allowed on.', goodWith: ['Dogs', 'Kids'], favorite: false, applied: false, daysWaiting: 47 },
  { id: 'a5', name: 'Pip', species: 'dog', breed: 'Terrier mix puppy', ageLabel: '4 months', sex: 'boy', size: 'small', photo: photo(1199), shelter: 'Harbourside Animal Shelter', distanceKm: 3.4, traits: ['Puppy', 'Bouncy', 'Brave'], story: 'Pip is a tiny tornado with a huge heart. He’s crate-training well and would love a home with patience and toys.', goodWith: ['Dogs', 'Kids'], favorite: false, applied: false, daysWaiting: 9 },
  { id: 'a6', name: 'Salem', species: 'cat', breed: 'Black shorthair', ageLabel: '4 years', sex: 'boy', size: 'small', photo: photo(403), shelter: 'Cedar Hill Cat Haven', distanceKm: 2.7, traits: ['Mellow', 'Lap cat', 'Shy at first'], story: 'Black cats wait the longest for homes. Salem is a gentle soul who will choose you and never leave your side.', goodWith: ['Adults', 'Cats'], favorite: false, applied: false, daysWaiting: 112 },
];

// ------------------------------------------------------------------ assemble
const novKm = walks.filter((w) => w.petIds.includes('juniper') || w.petIds.includes('biscuit')).reduce((s, w) => s + w.distanceKm, 0);
challenges[0].progress = +novKm.toFixed(1);

export function createSeedDatabase(): Database {
  return structuredClone({
    version: SEED_VERSION,
    meId: 'maya',
    activePetId: 'biscuit',
    owners, pets,
    followingPetIds: ['sunny', 'bento', 'nimbus', 'fig', 'waffles', 'marmalade', 'pepper', 'clyde', 'ziggy', 'dumpling', 'kodiak', 'tilly', 'pretzel', 'rusty', 'luna', 'kiwi', 'maple', 'blue', 'cocoa', 'pharaoh', 'spike'],
    posts, stories, walks, places, events, packs, conversations, notifications, memories, diary, albums, badges, challenges, contests, lost, adoption,
    rewards: {
      treats: 1240, streak: 6, lastCheckIn: ago(D), lastSpin: undefined, coupons: [],
      ledger: [
        { id: 'lg1', amount: 25, reason: 'Walk with Juniper & Biscuit', at: ago(D + 2 * H) },
        { id: 'lg2', amount: 10, reason: 'New post', at: ago(4 * H) },
        { id: 'lg3', amount: 15, reason: 'Daily check-in · 6-day streak', at: ago(D) },
        { id: 'lg4', amount: -50, reason: 'Redeemed: Free pup cup', at: ago(3 * D) },
      ],
    },
    weeklyGoalKm: 20,
  });
}

/** Sample photos offered in the composer when you don't have a file handy. */
export const SAMPLE_UPLOADS: MediaItem[] = [1213, 1258, 1114, 520, 670, 1006, 695, 1141, 1217, 880].map((n) => photo(n));
