import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?/`~'.split('');

type GameState = 'idle' | 'playing' | 'finished';

function pick() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

export default function SymbolSmash() {
  const [state, setState] = useState<GameState>('idle');
  const [current, setCurrent] = useState('');
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const next = useCallback(() => setCurrent(pick()), []);

  const start = useCallback(() => {
    setScore(0);
    setErrors(0);
    setTimeLeft(30);
    setFeedback(null);
    next();
    setState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [next]);

  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((tl) => { if (tl <= 1) { setState('finished'); return 0; } return tl - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (state !== 'playing') return;
    const key = e.key;
    if (key === current) {
      setScore((s) => s + 1);
      setFeedback('correct');
      next();
    } else if (key.length === 1) {
      setErrors((er) => er + 1);
      setFeedback('wrong');
    }
    setTimeout(() => setFeedback(null), 200);
  };

  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Time', value: `${timeLeft}s`, hi: timeLeft <= 5 && state === 'playing' },
          { label: 'Score', value: score, hi: false },
          { label: 'Accuracy', value: state === 'idle' ? '—' : `${accuracy}%`, hi: false },
        ].map((s) => (
          <div key={s.label} className={cn('p-3 rounded-xl border bg-card text-center', s.hi ? 'border-red-500/50' : 'border-border')}>
            <div className={cn('text-2xl font-bold', s.hi ? 'text-red-400' : 'text-primary')}>{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Symbol display */}
      <div className="flex items-center justify-center min-h-[160px] rounded-2xl border border-border bg-card">
        {state === 'idle' && (
          <div className="text-center space-y-2">
            <Hash className="w-10 h-10 mx-auto text-border" />
            <p className="text-foreground/30 text-sm">Press the shown symbol as fast as you can!</p>
          </div>
        )}
        {state === 'finished' && (
          <div className="text-center space-y-1">
            <Hash className="w-10 h-10 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold text-foreground">{score}</p>
            <p className="text-foreground/60 text-sm">symbols · {accuracy}% accuracy</p>
          </div>
        )}
        {state === 'playing' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current + score}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={cn(
                'w-28 h-28 rounded-2xl border-2 flex items-center justify-center text-6xl font-bold font-mono transition-all',
                feedback === 'correct' ? 'border-green-400 bg-green-400/10 text-green-400'
                : feedback === 'wrong' ? 'border-red-400 bg-red-400/10 text-red-400'
                : 'border-primary bg-primary/10 text-primary'
              )}
            >
              {current}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {state === 'playing' && (
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          readOnly
          className="w-full p-3 rounded-xl border border-border bg-card text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Press the symbol shown above…"
        />
      )}

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
