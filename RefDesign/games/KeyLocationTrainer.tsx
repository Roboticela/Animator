import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type GameState = 'idle' | 'playing' | 'finished';

function randomLetter() { return LETTERS[Math.floor(Math.random() * LETTERS.length)]; }

export default function KeyLocationTrainer() {
  const [state, setState] = useState<GameState>('idle');
  const [target, setTarget] = useState('');
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const next = useCallback(() => setTarget(randomLetter()), []);

  const start = useCallback(() => {
    setScore(0);
    setErrors(0);
    setTimeLeft(30);
    setFeedback(null);
    setStreak(0);
    setBestStreak(0);
    next();
    setState('playing');
  }, [next]);

  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((tl) => { if (tl <= 1) { setState('finished'); return 0; } return tl - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.length !== 1 || !LETTERS.includes(key)) return;
      if (key === target) {
        setScore((s) => s + 1);
        setStreak((st) => {
          const ns = st + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
        setFeedback('correct');
        next();
      } else {
        setErrors((er) => er + 1);
        setStreak(0);
        setFeedback('wrong');
      }
      setTimeout(() => setFeedback(null), 200);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, target, next]);

  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Time', value: `${timeLeft}s`, hi: timeLeft <= 5 && state === 'playing' },
          { label: 'Score', value: score, hi: false },
          { label: 'Streak', value: streak, hi: false },
          { label: 'Accuracy', value: `${accuracy}%`, hi: false },
        ].map((s) => (
          <div key={s.label} className={cn('p-3 rounded-xl border bg-card text-center', s.hi ? 'border-red-500/50' : 'border-border')}>
            <div className={cn('text-2xl font-bold', s.hi ? 'text-red-400' : 'text-primary')}>{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Target display */}
      <div className="flex flex-col items-center justify-center min-h-[200px] rounded-2xl border border-border bg-card gap-4">
        {state === 'idle' && (
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 mx-auto text-border" />
            <p className="text-foreground/30 text-sm">Press the correct letter key when it appears!</p>
          </div>
        )}

        {state === 'finished' && (
          <div className="text-center space-y-2">
            <MapPin className="w-10 h-10 mx-auto text-primary" />
            <p className="text-3xl font-bold text-foreground">{score}</p>
            <p className="text-foreground/60 text-sm">keys found · {accuracy}% accuracy · best streak {bestStreak}</p>
          </div>
        )}

        {state === 'playing' && (
          <div className="text-center">
            <p className="text-sm text-foreground/40 mb-4">Press this key:</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={target + score}
                initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'w-32 h-32 rounded-3xl border-2 flex items-center justify-center mx-auto transition-all duration-100',
                  feedback === 'correct' ? 'border-green-400 bg-green-400/15 text-green-400'
                  : feedback === 'wrong' ? 'border-red-400 bg-red-400/15 text-red-400'
                  : 'border-primary bg-primary/10 text-primary'
                )}
              >
                <span className="text-7xl font-bold font-mono">{target}</span>
              </motion.div>
            </AnimatePresence>
            {streak >= 3 && (
              <motion.p
                key={streak}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm font-semibold text-yellow-400"
              >
                🔥 {streak} streak!
              </motion.p>
            )}
          </div>
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
