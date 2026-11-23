import { BadgeCheck, Sparkles } from 'lucide-react';
import type { Pet } from '../../types';
import { STAT_LABELS } from '../../data/meta';
import { ageLabel, levelFromXp } from '../../utils/format';

/**
 * The Pet Card: a collectible, shareable "trading card" of a pet's personality.
 * Rarity tier comes from their level.
 */
export function PetCard({ pet, flip = false }: { pet: Pet; flip?: boolean }) {
  const lvl = levelFromXp(pet.xp);
  const tier = lvl.level >= 30 ? 'legend' : lvl.level >= 18 ? 'gold' : lvl.level >= 10 ? 'silver' : 'bronze';
  return (
    <div className={`petcard tier-${tier} ${flip ? 'flip' : ''}`}>
      <div className="petcard-inner">
        <div className="petcard-front">
          <div className="petcard-top">
            <span className="petcard-lvl">LV {lvl.level}</span>
            <span className="petcard-tier">{tier}</span>
          </div>
          <div className="petcard-photo"><img src={pet.avatar} alt={pet.name} /></div>
          <div className="petcard-name">
            <span>{pet.name}</span>{pet.verified && <BadgeCheck size={16} />}
            <span className="petcard-species">{pet.species === 'small' ? 'small pet' : pet.species}</span>
          </div>
          <p className="petcard-arch"><Sparkles size={12} /> {pet.personality.archetype}</p>
          <div className="petcard-stats">
            {(Object.keys(pet.stats) as (keyof Pet['stats'])[]).map((k) => (
              <div key={k} className="petcard-stat">
                <span>{STAT_LABELS[k].label}</span>
                <span className="petcard-bar"><span style={{ width: `${pet.stats[k]}%`, background: STAT_LABELS[k].color }} /></span>
                <b>{pet.stats[k]}</b>
              </div>
            ))}
          </div>
          <div className="petcard-foot"><span>{pet.breed}</span><span>{ageLabel(pet.birthday)}</span></div>
        </div>
        <div className="petcard-back">
          <p className="eyebrow">Personality</p>
          <p className="small">{pet.personality.summary}</p>
          <p className="eyebrow" style={{ marginTop: 10 }}>Known quirks</p>
          <ul className="petcard-quirks">{pet.personality.quirks.map((q) => <li key={q}>{q}</li>)}</ul>
          <p className="eyebrow" style={{ marginTop: 10 }}>Favourite things</p>
          <div className="row wrap" style={{ gap: 6 }}>{pet.favorites.map((f) => <span key={f} className="pill">{f}</span>)}</div>
        </div>
      </div>
    </div>
  );
}
