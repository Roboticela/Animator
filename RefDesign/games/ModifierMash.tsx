import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Layers, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Combo { display: string; keys: string[]; }

const COMBOS: Combo[] = [
  { display: 'Ctrl + C', keys: ['ctrl', 'c'] },
  { display: 'Ctrl + V', keys: ['ctrl', 'v'] },
  { display: 'Ctrl + Z', keys: ['ctrl', 'z'] },
  { display: 'Ctrl + A', keys: ['ctrl', 'a'] },
  { display: 'Ctrl + S', keys: ['ctrl', 's'] },
  { display: 'Ctrl + F', keys: ['ctrl', 'f'] },
  { display: 'Ctrl + X', keys: ['ctrl', 'x'] },
  { display: 'Alt + Tab', keys: ['alt', 'tab'] },
  { display: 'Shift + A', keys: ['shift', 'a'] },
  { display: 'Ctrl + Shift + Z', keys: ['ctrl', 'shift', 'z'] },
  { display: 'Ctrl + Y', keys: ['ctrl', 'y'] },
  { display: 'Ctrl + W', keys: ['ctrl', 'w'] },
  { display: 'Ctrl + N', keys: ['ctrl', 'n'] },
  { display: 'Ctrl + T', keys: ['ctrl', 't'] },
  { display: 'Ctrl + P', keys: ['ctrl', 'p'] },
];

type GameState = 'idle' | 'playing' | 'finished';
type FeedbackType = 'correct' | 'wrong' | null;

function normalizeKey(k: string): string {
  if (k === 'Control') return 'ctrl';
  if (k === 'Alt') return 'alt';
  if (k === 'Shift') return 'shift';
  if (k === 'Meta') return 'meta';
  if (k === 'Tab') return 'tab';
  return k.toLowerCase();
}

function pick(arr: Combo[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ModifierMash() {
  const [state, setState] = useState<GameState>('idle');
  const [current, setCurrent] = useState<Combo | null>(null);
  const [heldKeys, setHeldKeys] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(15);
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  const nextCombo = useCallback(() => {
    setCurrent(pick(COMBOS));
    setHeldKeys(new Set());
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setErrors(0);
    setRound(1);
    setFeedback(null);
    nextCombo();
    setState('playing');
  }, [nextCombo]);

  useEffect(() => {
    if (state !== 'playing' || !current) return;
    const pressed = new Set<string>();

    const onDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const k = normalizeKey(e.key);
      pressed.add(k);
      setHeldKeys(new Set(pressed));

      const allHeld = current.keys.every((req) => pressed.has(req));

      if (allHeld) {
        setFeedback('correct');
        setScore((s) => s + 1);
        setTimeout(() => {
          setFeedback(null);
          if (round >= totalRounds) { setState('finished'); }
          else { setRound((r) => r + 1); nextCombo(); }
        }, 500);
      }
    };

    const onUp = (e: KeyboardEvent) => {
      const k = normalizeKey(e.key);
      pressed.delete(k);
      setHeldKeys(new Set(pressed));
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [state, current, round, totalRounds, nextCombo]);

  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{state === 'idle' ? '—' : `${round}/${totalRounds}`}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Round</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Score</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{state === 'idle' ? '—' : `${accuracy}%`}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Accuracy</div>
        </div>
      </div>

      {/* Combo display */}
      <div className={cn('min-h-[200px] rounded-2xl border bg-card flex flex-col items-center justify-center gap-4 transition-all', feedback === 'correct' ? 'border-green-400/60' : feedback === 'wrong' ? 'border-red-400/60' : 'border-border')}>
        {state === 'idle' && (
          <div className="text-center space-y-2">
            <Layers className="w-12 h-12 mx-auto text-border" />
            <p className="text-foreground/30 text-sm">Press the correct key combinations!</p>
          </div>
        )}

        {state === 'finished' && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center space-y-2">
            <Layers className="w-12 h-12 mx-auto text-primary" />
            <p className="text-3xl font-bold text-foreground">{score}/{totalRounds}</p>
            <p className="text-foreground/60 text-sm">{accuracy}% accuracy</p>
          </motion.div>
        )}

        {state === 'playing' && current && (
          <>
            <p className="text-sm text-foreground/40">Press this combination:</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.display}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 flex-wrap justify-center"
              >
                {current.display.split(' + ').map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-2">
                    <kbd className={cn(
                      'px-3 py-2 rounded-lg border-2 font-mono font-bold text-lg transition-all',
                      heldKeys.has(part.toLowerCase()) || heldKeys.has(normalizeKey(part))
                        ? 'border-green-400 bg-green-400/20 text-green-400'
                        : feedback === 'correct'
                        ? 'border-green-400 bg-green-400/10 text-green-400'
                        : 'border-primary/40 bg-primary/10 text-primary'
                    )}>
                      {part}
                    </kbd>
                    {i < arr.length - 1 && <span className="text-foreground/40 font-bold">+</span>}
                  </span>
                ))}
              </motion.div>
            </AnimatePresence>
            <div className={cn('flex items-center gap-2 text-sm font-medium transition-colors', feedback === 'correct' ? 'text-green-400' : feedback === 'wrong' ? 'text-red-400' : 'text-foreground/40')}>
              {feedback === 'correct' && <><CheckCircle className="w-4 h-4" />Correct!</>}
              {feedback === 'wrong' && <><XCircle className="w-4 h-4" />Try again</>}
              {feedback === null && 'Hold all keys simultaneously'}
            </div>
          </>
        )}
      </div>

      <motion.button
        onClick={start}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-fit transition-all',
          state === 'idle' || state === 'finished' ? 'bg-primary text-background hover:bg-primary/90' : 'border border-border bg-card text-foreground/50 cursor-not-allowed'
        )}
        disabled={state === 'playing'}
      >
        {state === 'idle' ? <><Play className="w-4 h-4" />Play</> : state === 'finished' ? <><RotateCcw className="w-4 h-4" />Play Again</> : <><Layers className="w-4 h-4" />In Progress…</>}
      </motion.button>
    </div>
  );
}
