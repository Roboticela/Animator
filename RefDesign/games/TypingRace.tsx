import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Flag, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionPool, TYPING_SENTENCE_POOL } from '@/lib/content';

const sentencePool = new SessionPool(TYPING_SENTENCE_POOL);

type GameState = 'idle' | 'countdown' | 'playing' | 'won' | 'lost';

export default function TypingRace() {
  const [state, setState] = useState<GameState>('idle');
  const [sentence, setSentence] = useState('');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [countdown, setCountdown] = useState(3);
  const [timeUsed, setTimeUsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const start = useCallback(() => {
    setSentence(sentencePool.next());
    setTyped('');
    setCountdown(3);
    setTimeLeft(30);
    setState('countdown');
  }, []);

  useEffect(() => {
    if (state !== 'countdown') return;
    if (countdown <= 0) {
      setState('playing');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, countdown]);

  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) { setState('lost'); return 0; }
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state !== 'playing') return;
    const val = e.target.value;
    if (val.length > sentence.length) return;
    setTyped(val);
    if (val === sentence) {
      setTimeUsed(30 - timeLeft);
      setState('won');
    }
  };

  const correct = typed.split('').filter((c, i) => c === sentence[i]).length;
  const progress = sentence.length > 0 ? Math.round((correct / sentence.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Timer */}
      {(state === 'playing' || state === 'won' || state === 'lost') && (
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-foreground/60" />
          <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full transition-colors', timeLeft > 15 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-400')}
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className={cn('text-lg font-bold min-w-[2.5rem] text-right', timeLeft <= 5 ? 'text-red-400' : 'text-foreground')}>
            {timeLeft}s
          </span>
        </div>
      )}

      {/* Progress bar */}
      {state === 'playing' && (
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      )}

      {/* Main area */}
      <div className="min-h-[200px] rounded-2xl border border-border bg-card flex items-center justify-center p-6">
        {state === 'idle' && (
          <div className="text-center space-y-2">
            <Flag className="w-12 h-12 mx-auto text-border" />
            <p className="text-foreground/40 text-sm">Complete the sentence before time runs out!</p>
          </div>
        )}

        {state === 'countdown' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-8xl font-bold text-primary"
            >
              {countdown === 0 ? 'GO!' : countdown}
            </motion.div>
          </AnimatePresence>
        )}

        {state === 'playing' && (
          <div className="w-full space-y-4">
            <p className="font-mono text-base leading-loose text-center">
              {sentence.split('').map((char, i) => {
                let cls = 'text-foreground/50';
                if (i < typed.length) cls = typed[i] === char ? 'text-green-400' : 'text-red-400 underline';
                else if (i === typed.length) cls = 'border-b-2 border-primary text-foreground';
                return <span key={i} className={cls}>{char}</span>;
              })}
            </p>
          </div>
        )}

        {state === 'won' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
            <Trophy className="w-14 h-14 mx-auto text-yellow-400" />
            <h3 className="text-2xl font-bold text-foreground">You Won!</h3>
            <p className="text-foreground/60 text-sm">Completed in {timeUsed}s · {30 - timeUsed}s remaining</p>
          </motion.div>
        )}

        {state === 'lost' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
            <Clock className="w-14 h-14 mx-auto text-red-400" />
            <h3 className="text-2xl font-bold text-foreground">Time&apos;s Up!</h3>
            <p className="text-foreground/60 text-sm">{progress}% complete — so close!</p>
          </motion.div>
        )}
      </div>

      {/* Input */}
      {state === 'playing' && (
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onPaste={(e) => e.preventDefault()}
          className="w-full p-3 rounded-xl border border-border bg-card text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          placeholder="Type here…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
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
        {state === 'idle' ? <><Play className="w-4 h-4" />Race!</> : <><RotateCcw className="w-4 h-4" />Try Again</>}
      </motion.button>
    </div>
  );
}
