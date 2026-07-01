import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Backspace Blitz: A pre-filled text is shown with N extra "typo" characters
 * appended at the end (highlighted in red). The user must press Backspace
 * that many times to clear them and complete the round.
 */

import { SessionPool, PHRASE_POOL } from '@/lib/content';

const phrasePool = new SessionPool(PHRASE_POOL);

const TYPO_CHARS = 'xzqjwvk'.split('');

function makeRound(roundNum: number) {
  const phrase = phrasePool.next();
  const typoCount = Math.min(1 + Math.floor(roundNum / 2), 5);
  const typos = Array.from({ length: typoCount }, () =>
    TYPO_CHARS[Math.floor(Math.random() * TYPO_CHARS.length)]
  ).join('');
  return { phrase, typos, typoCount };
}

type GameState = 'idle' | 'playing' | 'finished';

export default function BackspaceBlitz() {
  const [state, setState] = useState<GameState>('idle');
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [, setRoundNum] = useState(0);
  const [phrase, setPhrase] = useState('');
  const [typos, setTypos] = useState('');
  const [backspacesLeft, setBackspacesLeft] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadRound = useCallback((rn: number) => {
    const { phrase: p, typos: t, typoCount } = makeRound(rn);
    setPhrase(p);
    setTypos(t);
    setBackspacesLeft(typoCount);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setRoundNum(1);
    setTimeLeft(45);
    setState('playing');
    loadRound(1);
  }, [loadRound]);

  useEffect(() => {
    if (state !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((tl) => { if (tl <= 1) { setState('finished'); return 0; } return tl - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (state !== 'playing') return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      setBackspacesLeft((bl) => {
        if (bl <= 1) {
          // Round complete
          setScore((s) => s + 1);
          setRoundNum((rn) => {
            const next = rn + 1;
            loadRound(next);
            return next;
          });
          return 0;
        }
        return bl - 1;
      });
    }
  };

  const displayText = phrase + typos;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Time', value: `${timeLeft}s`, hi: timeLeft <= 10 && state === 'playing' },
          { label: 'Fixed', value: score, hi: false },
          { label: 'Backspaces', value: state === 'idle' ? '—' : backspacesLeft, hi: backspacesLeft > 0 },
        ].map((s) => (
          <div key={s.label} className={cn('p-3 rounded-xl border bg-card text-center', s.hi && s.label === 'Time' ? 'border-red-500/50' : s.hi && s.label === 'Backspaces' ? 'border-yellow-500/50' : 'border-border')}>
            <div className={cn('text-2xl font-bold', s.hi && s.label === 'Time' ? 'text-red-400' : s.hi && s.label === 'Backspaces' ? 'text-yellow-400' : 'text-primary')}>{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Instruction */}
      {state !== 'idle' && (
        <div className="px-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground/40 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-foreground/60 bg-accent/30">Backspace</kbd> to delete the{' '}
          <span className="text-red-400 font-medium">{backspacesLeft} red character{backspacesLeft !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Text display */}
      <div className="p-5 rounded-2xl border border-border bg-card min-h-[110px] flex flex-col justify-center">
        {state === 'idle' ? (
          <div className="flex flex-col items-center gap-2">
            <Eraser className="w-10 h-10 text-border" />
            <p className="text-foreground/30 italic text-sm text-center">
              Use Backspace to delete the red typo characters at the end of each phrase!
            </p>
          </div>
        ) : state === 'finished' ? (
          <div className="text-center space-y-2">
            <Eraser className="w-8 h-8 mx-auto text-primary" />
            <p className="text-2xl font-bold text-foreground">{score} rounds fixed</p>
            <p className="text-foreground/60 text-sm">in 45 seconds</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-foreground/30 mb-3 uppercase tracking-widest">Delete the red characters:</p>
            <p className="font-mono text-xl leading-loose">
              {displayText.split('').map((char, i) => {
                const isTypo = i >= phrase.length;
                const isActive = isTypo && i >= phrase.length + (typos.length - backspacesLeft);
                return (
                  <span
                    key={i}
                    className={cn(
                      isActive
                        ? 'text-red-400 bg-red-400/15 rounded px-0.5 underline decoration-red-400/60'
                        : isTypo
                        ? 'text-foreground/20 line-through'
                        : 'text-foreground'
                    )}
                  >
                    {char}
                  </span>
                );
              })}
            </p>
          </>
        )}
      </div>

      {/* Hidden input to capture backspace */}
      {state === 'playing' && (
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          readOnly
          className="w-full p-3 rounded-xl border border-primary/40 bg-primary/5 text-foreground text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Click here, then press Backspace to fix typos"
        />
      )}

      {/* Progress bar */}
      {state === 'playing' && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', timeLeft > 20 ? 'bg-primary' : timeLeft > 10 ? 'bg-yellow-400' : 'bg-red-400')}
              animate={{ width: `${(timeLeft / 45) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {state === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-2">
            <Eraser className="w-8 h-8 mx-auto text-primary" />
            <h3 className="text-xl font-bold text-foreground">{score} rounds</h3>
            <p className="text-foreground/60 text-sm">corrected in 45 seconds</p>
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
        {state === 'idle' ? <><Play className="w-4 h-4" />Play</> : <><RotateCcw className="w-4 h-4" />Restart</>}
      </motion.button>
    </div>
  );
}
