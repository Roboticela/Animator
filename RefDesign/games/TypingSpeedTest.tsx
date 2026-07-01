import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionPool, PASSAGE_POOL } from '@/lib/content';

const passagePool = new SessionPool(PASSAGE_POOL);

type GameState = 'idle' | 'playing' | 'finished';

export default function TypingSpeedTest() {
  const [state, setState] = useState<GameState>('idle');
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [, setStartTime] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickPassage = useCallback(() => {
    setPassage(passagePool.next());
  }, []);

  const start = useCallback(() => {
    pickPassage();
    setTyped('');
    setTimeLeft(60);
    setStartTime(Date.now());
    setState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [pickPassage]);

  const finish = useCallback(() => {
    setState('finished');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (state !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { finish(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state, finish]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (state !== 'playing') return;
    setTyped(val);
    if (val === passage) finish();
  };

  const correctChars = typed.split('').filter((c, i) => c === passage[i]).length;
  const totalTyped = typed.length;
  const errors = totalTyped - correctChars;
  const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
  const elapsed = state === 'finished' ? 60 - timeLeft : 60 - timeLeft;
  const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = elapsed > 0 ? Math.round((wordsTyped / elapsed) * 60) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Time', value: state === 'playing' ? `${timeLeft}s` : state === 'finished' ? `${60 - timeLeft}s` : '60s', highlight: timeLeft <= 10 && state === 'playing' },
          { label: 'WPM', value: state === 'idle' ? '—' : wpm, highlight: false },
          { label: 'Accuracy', value: state === 'idle' ? '—' : `${accuracy}%`, highlight: false },
          { label: 'Errors', value: state === 'idle' ? '—' : errors, highlight: errors > 5 },
        ].map((s) => (
          <div key={s.label} className={cn('p-3 rounded-xl border bg-card text-center', s.highlight ? 'border-red-500/50' : 'border-border')}>
            <div className={cn('text-xl font-bold', s.highlight ? 'text-red-400' : 'text-primary')}>{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Passage display */}
      <div className="p-4 rounded-2xl border border-border bg-card min-h-[120px] font-mono text-sm leading-relaxed select-none">
        {state === 'idle' ? (
          <p className="text-foreground/30 italic">Press Play to begin the test…</p>
        ) : (
          <p>
            {passage.split('').map((char, i) => {
              let cls = 'text-foreground/40';
              if (i < typed.length) {
                cls = typed[i] === char ? 'text-green-400' : 'text-red-400 bg-red-400/20 rounded';
              } else if (i === typed.length) {
                cls = 'text-foreground border-b-2 border-primary';
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

      {/* Input area */}
      {state === 'playing' && (
        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleInput}
          onPaste={(e) => e.preventDefault()}
          className="w-full p-4 rounded-xl border border-border bg-card text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          rows={4}
          placeholder="Start typing here…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      )}

      {/* Result */}
      <AnimatePresence>
        {state === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-3"
          >
            <Gauge className="w-10 h-10 mx-auto text-primary" />
            <h3 className="text-2xl font-bold text-foreground">{wpm} WPM</h3>
            <p className="text-foreground/60">
              {accuracy}% accuracy · {errors} error{errors !== 1 ? 's' : ''} · {correctChars} correct chars
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        <motion.button
          onClick={start}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
            state === 'idle'
              ? 'bg-primary text-background hover:bg-primary/90'
              : 'border border-border bg-card text-foreground hover:bg-accent'
          )}
        >
          {state === 'idle' ? (
            <><Play className="w-4 h-4" /> Play</>
          ) : (
            <><RotateCcw className="w-4 h-4" /> Restart</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
