import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionPool, WORDS } from '@/lib/content';

const wordPool = new SessionPool(WORDS);

function pickWord() {
  return wordPool.next();
}

type GameState = 'idle' | 'playing' | 'finished';

export default function WordSprint() {
  const [state, setState] = useState<GameState>('idle');
  const [current, setCurrent] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextWord = useCallback(() => setCurrent(pickWord()), []);

  const start = useCallback(() => {
    setScore(0);
    setMissed(0);
    setTimeLeft(30);
    setInput('');
    setFeedback(null);
    nextWord();
    setState('playing');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [nextWord]);

  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) { setState('finished'); return 0; }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed === current) {
        setScore((s) => s + 1);
        setFeedback('correct');
      } else {
        setMissed((m) => m + 1);
        setFeedback('wrong');
      }
      setInput('');
      nextWord();
      setTimeout(() => setFeedback(null), 400);
    }
  };

  const accuracy = score + missed > 0 ? Math.round((score / (score + missed)) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Time', value: `${timeLeft}s`, hi: timeLeft <= 5 && state === 'playing' },
          { label: 'Words', value: score, hi: false },
          { label: 'Accuracy', value: state === 'idle' ? '—' : `${accuracy}%`, hi: false },
        ].map((s) => (
          <div key={s.label} className={cn('p-3 rounded-xl border bg-card text-center', s.hi ? 'border-red-500/50' : 'border-border')}>
            <div className={cn('text-2xl font-bold', s.hi ? 'text-red-400' : 'text-primary')}>{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Word display */}
      <div className="flex items-center justify-center min-h-[140px] rounded-2xl border border-border bg-card">
        {state === 'idle' ? (
          <p className="text-foreground/30 italic text-sm">Press Play to start</p>
        ) : state === 'finished' ? (
          <div className="text-center space-y-1">
            <Zap className="w-10 h-10 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold text-foreground">{score}</p>
            <p className="text-foreground/60 text-sm">words in 30 seconds</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-4xl font-bold font-mono tracking-widest transition-colors',
                feedback === 'correct' ? 'text-green-400' : feedback === 'wrong' ? 'text-red-400' : 'text-foreground'
              )}
            >
              {current}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      {state === 'playing' && (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full p-3 rounded-xl border bg-card text-foreground font-mono text-center text-lg focus:outline-none focus:ring-2 transition-all',
            feedback === 'correct' ? 'border-green-400 focus:ring-green-400/40' :
            feedback === 'wrong' ? 'border-red-400 focus:ring-red-400/40' :
            'border-border focus:ring-primary/40 focus:border-primary/40'
          )}
          placeholder="Type the word and press Space…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      )}

      {/* Result row */}
      {state === 'finished' && (
        <div className="text-center text-foreground/60 text-sm">
          {score} correct · {missed} missed · {accuracy}% accuracy
        </div>
      )}

      {/* Controls */}
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
