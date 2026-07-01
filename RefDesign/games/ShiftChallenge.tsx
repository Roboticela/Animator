import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, CaseSensitive } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionPool, SHIFT_POOL } from '@/lib/content';

const challengePool = new SessionPool(SHIFT_POOL);

type GameState = 'idle' | 'playing' | 'finished';

export default function ShiftChallenge() {
  const [state, setState] = useState<GameState>('idle');
  const [challenge, setChallenge] = useState('');
  const [typed, setTyped] = useState('');
  const [, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickChallenge = useCallback(() => challengePool.next(), []);

  const start = useCallback(() => {
    setChallenge(pickChallenge());
    setTyped('');
    setScore(0);
    setErrors(0);
    setStartTime(Date.now());
    setElapsed(0);
    setState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [pickChallenge]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state !== 'playing') return;
    const val = e.target.value;
    if (val.length > challenge.length) return;
    
    // Count new errors
    if (val.length > typed.length) {
      const newChar = val[val.length - 1];
      const expected = challenge[val.length - 1];
      if (newChar !== expected) setErrors((er) => er + 1);
    }
    
    setTyped(val);
    if (val === challenge) {
      const t = Date.now() - startTime;
      setElapsed(t);
      const correct = val.split('').filter((c, i) => c === challenge[i]).length;
      setScore(correct);
      setState('finished');
    }
  };

  const correct = typed.split('').filter((c, i) => c === challenge[i]).length;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const progress = challenge.length > 0 ? Math.round((typed.length / challenge.length) * 100) : 0;
  const wpm = elapsed > 0 ? Math.round((challenge.split(' ').length / (elapsed / 1000)) * 60) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Progress', value: state === 'idle' ? '—' : `${progress}%` },
          { label: 'Accuracy', value: state === 'idle' ? '—' : `${accuracy}%` },
          { label: 'Errors', value: state === 'idle' ? '—' : errors },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Challenge display */}
      <div className="p-5 rounded-2xl border border-border bg-card min-h-[100px]">
        {state === 'idle' ? (
          <div className="flex flex-col items-center justify-center h-full py-6 gap-2">
            <CaseSensitive className="w-10 h-10 text-border" />
            <p className="text-foreground/30 italic text-sm">Press Play for a mixed-case challenge</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-foreground/30 uppercase tracking-widest mb-3">Type this exactly:</p>
            <p className="font-mono text-base leading-loose break-all">
              {challenge.split('').map((char, i) => {
                let cls = 'text-foreground/40';
                if (i < typed.length) {
                  cls = typed[i] === char ? 'text-green-400' : 'text-red-400 underline decoration-red-400/70';
                } else if (i === typed.length) {
                  cls = 'border-b-2 border-primary text-foreground';
                }
                return <span key={i} className={cls}>{char}</span>;
              })}
            </p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {state !== 'idle' && (
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
        </div>
      )}

      {/* Input */}
      {state === 'playing' && (
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onPaste={(e) => e.preventDefault()}
          className={cn(
            'w-full p-3 rounded-xl border bg-card text-foreground font-mono focus:outline-none focus:ring-2 transition-all',
            errors > 3 ? 'border-red-400/60 focus:ring-red-400/30' : 'border-border focus:ring-primary/40 focus:border-primary/40'
          )}
          placeholder="Type the challenge above…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      )}

      {/* Result */}
      <AnimatePresence>
        {state === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-2">
            <CaseSensitive className="w-8 h-8 mx-auto text-primary" />
            <h3 className="text-xl font-bold text-foreground">{accuracy}% Accuracy</h3>
            <p className="text-foreground/60 text-sm">
              {errors === 0 ? 'Perfect!' : `${errors} error${errors !== 1 ? 's' : ''}`} · {wpm} WPM · {(elapsed / 1000).toFixed(1)}s
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button
          onClick={start}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
            state === 'idle' ? 'bg-primary text-background hover:bg-primary/90' : 'border border-border bg-card text-foreground hover:bg-accent'
          )}
        >
          {state === 'idle' ? <><Play className="w-4 h-4" />Play</> : <><RotateCcw className="w-4 h-4" />New Challenge</>}
        </motion.button>
      </div>
    </div>
  );
}
