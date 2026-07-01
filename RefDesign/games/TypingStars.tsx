import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const AREA_HEIGHT = 280; // px

interface FallingLetter {
  id: number;
  letter: string;
  x: number;       // 5–90 %
  y: number;       // px from top, 0..AREA_HEIGHT
  speed: number;   // px/tick
}

type GameState = 'idle' | 'playing' | 'finished';

let idCounter = 0;
const TICK_MS = 100;

export default function TypingStars() {
  const [state, setState] = useState<GameState>('idle');
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [destroyed, setDestroyed] = useState<Set<number>>(new Set());
  const stateRef = useRef<GameState>('idle');
  const livesRef = useRef(3);
  const scoreRef = useRef(0);

  const start = useCallback(() => {
    stateRef.current = 'playing';
    livesRef.current = 3;
    scoreRef.current = 0;
    setLetters([]);
    setScore(0);
    setLives(3);
    setDestroyed(new Set());
    setState('playing');
  }, []);

  // Spawn letters
  useEffect(() => {
    if (state !== 'playing') return;
    const spawnId = setInterval(() => {
      if (stateRef.current !== 'playing') return;
      setLetters((prev) => {
        if (prev.length >= 10) return prev;
        const newLetter: FallingLetter = {
          id: idCounter++,
          letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
          x: 5 + Math.random() * 82,
          y: 0,
          speed: 8 + scoreRef.current * 0.3,
        };
        return [...prev, newLetter];
      });
    }, 1400);
    return () => clearInterval(spawnId);
  }, [state]);

  // Move letters down
  useEffect(() => {
    if (state !== 'playing') return;
    const tickId = setInterval(() => {
      if (stateRef.current !== 'playing') return;
      setLetters((prev) => {
        const next: FallingLetter[] = [];
        let escaped = 0;
        for (const l of prev) {
          const newY = l.y + l.speed;
          if (newY >= AREA_HEIGHT) {
            escaped++;
          } else {
            next.push({ ...l, y: newY });
          }
        }
        if (escaped > 0) {
          livesRef.current = Math.max(0, livesRef.current - escaped);
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            stateRef.current = 'finished';
            setState('finished');
          }
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(tickId);
  }, [state]);

  // Keyboard input
  useEffect(() => {
    if (state !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (stateRef.current !== 'playing') return;
      const key = e.key.toUpperCase();
      setLetters((prev) => {
        const idx = prev.findIndex((l) => l.letter === key);
        if (idx === -1) return prev;
        const hit = prev[idx];
        setDestroyed((d) => { const nd = new Set(d); nd.add(hit.id); return nd; });
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setTimeout(() => setDestroyed((d) => { const nd = new Set(d); nd.delete(hit.id); return nd; }), 300);
        return prev.filter((_, i) => i !== idx);
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-foreground/40">destroyed</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <Heart key={i} className={cn('w-5 h-5 transition-all', i <= lives ? 'text-red-400 fill-red-400' : 'text-border')} />
          ))}
        </div>
      </div>

      {/* Game area */}
      <div
        className="relative w-full rounded-2xl border border-border bg-card overflow-hidden select-none"
        style={{ height: AREA_HEIGHT }}
      >
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Star className="w-12 h-12 text-border" />
            <p className="text-foreground/40 text-sm text-center px-4">Press keys to destroy the falling letters before they escape!</p>
          </div>
        )}

        {state === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 backdrop-blur-sm"
          >
            <Star className="w-10 h-10 text-primary" />
            <p className="text-4xl font-bold text-foreground">{score}</p>
            <p className="text-foreground/60 text-sm">letters destroyed</p>
          </motion.div>
        )}

        {state === 'playing' && (
          <AnimatePresence>
            {letters.map((letter) => (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                style={{
                  position: 'absolute',
                  left: `${letter.x}%`,
                  top: letter.y,
                  transform: 'translateX(-50%)',
                }}
                className={cn(
                  'w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg font-bold font-mono transition-colors',
                  destroyed.has(letter.id)
                    ? 'border-green-400 bg-green-400/20 text-green-400'
                    : 'border-primary/50 bg-primary/10 text-primary'
                )}
              >
                {letter.letter}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <motion.button
        onClick={start}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-fit transition-all',
          state === 'idle' ? 'bg-primary text-background hover:bg-primary/90' : 'border border-border bg-card text-foreground hover:bg-accent'
        )}
      >
        {state === 'idle' ? <><Play className="w-4 h-4" />Play</> : <><RotateCcw className="w-4 h-4" />Restart</>}
      </motion.button>
    </div>
  );
}
