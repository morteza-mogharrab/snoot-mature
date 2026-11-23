import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { useDb, useUI } from '../../store/AppStore';
import { ai, typewriter, type ChatTurn } from '../../services/ai';
import { Modal } from '../ui/Kit';

const STARTERS = ['How are you today?', 'Are you hungry?', 'Want to go for a walk?', 'Tell me about yourself', 'Who’s a good pet?'];

/** "Talk to your pet": a playful AI persona built from the pet's personality profile. */
export function PetChat() {
  const db = useDb();
  const { chatPetId, openPetChat } = useUI();
  const pet = chatPetId ? db.pets[chatPetId] : undefined;
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [live, setLive] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const stop = useRef<() => void>(() => {});

  useEffect(() => {
    if (pet) setTurns([{ from: 'pet', text: `${pet.personality.voice === 'chaotic' ? 'OH HI!!' : 'Oh, hello.'} It’s me, ${pet.name}. Ask me anything (answers may contain snack requests).` }]);
    return () => stop.current();
  }, [pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [turns, live, thinking]);
  if (!pet) return null;

  const ask = async (msg: string) => {
    if (!msg.trim() || thinking) return;
    const history = [...turns, { from: 'me' as const, text: msg.trim() }];
    setTurns(history);
    setText('');
    setThinking(true);
    const reply = await ai.chat({ pet, history, message: msg });
    setThinking(false);
    stop.current = typewriter(reply, (p) => {
      setLive(p);
      if (p.length === reply.length) { setTurns((t) => [...t, { from: 'pet', text: reply }]); setLive(''); }
    });
  };

  return (
    <Modal onClose={() => openPetChat(null)} label={`Chat with ${pet.name}`} className="petchat">
      <header className="petchat-head">
        <img src={pet.avatar} alt="" />
        <div className="grow"><p className="bold">{pet.name}</p><p className="tiny muted"><Sparkles size={11} /> AI persona · {pet.personality.archetype}</p></div>
        <button className="icon-btn sm" onClick={() => openPetChat(null)} aria-label="Close"><X size={20} /></button>
      </header>
      <div className="petchat-body">
        {turns.map((t, i) => <div key={i} className={`bub ${t.from}`}>{t.text}</div>)}
        {live && <div className="bub pet">{live}</div>}
        {thinking && <div className="bub pet typing"><i /><i /><i /></div>}
        <div ref={end} />
      </div>
      <div className="chips" style={{ padding: '0 16px 10px' }}>{STARTERS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>
      <form className="petchat-input" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Say something to ${pet.name}…`} aria-label="Message" />
        <button className="icon-btn" disabled={!text.trim()} aria-label="Send"><Send size={20} /></button>
      </form>
      <p className="tiny faint" style={{ padding: '0 18px 14px' }}>For fun: replies are generated from {pet.name}’s personality profile, not their actual thoughts (sadly).</p>
    </Modal>
  );
}
