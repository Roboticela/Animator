import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionPool, TYPING_SENTENCE_POOL } from '@/lib/content';

const sentencePool = new SessionPool(TYPING_SENTENCE_POOL);

type GameState = 'idle' | 'playing' | 'finished';

export default function TypingAccuracy() {
  const [state, setState] = useState<GameState>('idle');
  const [sentence, setSentence] = useState('');
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = useCallback(() => {
    const s = sentencePool.next();
    setSentence(s);
    setTyped('');
    setStartTime(Date.now());
    setElapsed(0);
    setState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state !== 'playing') return;
    const val = e.target.value;
    if (val.length > sentence.length) return;
    setTyped(val);
    if (val === sentence) {
      setElapsed(Date.now() - startTime);
      setState('finished');
    }
  };

  const correct = typed.split('').filter((c, i) => c === sentence[i]).length;
  const errors = typed.length - correct;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const wpm = elapsed > 0 ? Math.round((sentence.split(' ').length / (elapsed / 1000)) * 60) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Accuracy', value: state === 'idle' ? '—' : `${accuracy}%` },
          { label: 'Errors', value: state === 'idle' ? '—' : errors },
          { label: 'Progress', value: state === 'idle' ? '—' : `${typed.length}/${sentence.length}` },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sentence display */}
      <div className="p-5 rounded-2xl border border-border bg-card min-h-[100px] font-mono text-base leading-loose select-none">
        {state === 'idle' ? (
          <p className="text-foreground/30 italic text-sm">Press Play to get your sentence…</p>
        ) : (
          <p>
            {sentence.split('').map((char, i) => {
              let cls = 'text-foreground/40';
              if (i < typed.length) {
                cls = typed[i] === char
                  ? 'text-green-400'
                  : 'text-red-400 underline decoration-red-400';
              } else if (i === typed.length) {
                cls = 'text-foreground border-b-2 border-primary animate-pulse';
              }
              return (
                <span key={i} className={cls}>
                  {char}
                </span>
              );
            })}
          </p>
        )}
      </div>

      {/* Input */}
      {state === 'playing' && (
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onPaste={(e) => e.preventDefault()}
          className={cn(
            'w-full p-3 rounded-xl border bg-card text-foreground font-mono focus:outline-none focus:ring-2 transition-all',
            errors > 0 ? 'border-red-400/60 focus:ring-red-400/30' : 'border-border focus:ring-primary/40 focus:border-primary/40'
          )}
          placeholder="Type the sentence exactly…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      )}

      {/* Accuracy bar */}
      {state !== 'idle' && (
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', accuracy >= 95 ? 'bg-green-400' : accuracy >= 80 ? 'bg-yellow-400' : 'bg-red-400')}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {state === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-2"
          >
            <Target className="w-8 h-8 mx-auto text-primary" />
            <h3 className="text-xl font-bold text-foreground">{accuracy}% Accuracy</h3>
            <p className="text-foreground/60 text-sm">
              {errors === 0 ? 'Perfect!' : `${errors} error${errors !== 1 ? 's' : ''}`} · {wpm} WPM
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={start}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-fit transition-all',
          state === 'idle' ? 'bg-primary text-background hover:bg-primary/90' : 'border border-border bg-card text-foreground hover:bg-accent'
        )}
      >
        {state === 'idle' ? <><Play className="w-4 h-4" />Play</> : <><RotateCcw className="w-4 h-4" />New Sentence</>}
      </motion.button>
    </div>
  );
}
