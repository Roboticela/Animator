import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Row definitions ──────────────────────────────────────────────────────────
const ROWS = {
  number: {
    label: 'Number Row',
    short: '0–9',
    keys: ['1','2','3','4','5','6','7','8','9','0'],
    color: 'text-blue-400 border-blue-400',
    bg: 'bg-blue-400',
  },
  top: {
    label: 'Top Row',
    short: 'QWERTY',
    keys: ['q','w','e','r','t','y','u','i','o','p'],
    color: 'text-purple-400 border-purple-400',
    bg: 'bg-purple-400',
  },
  home: {
    label: 'Home Row',
    short: 'ASDF…',
    keys: ['a','s','d','f','g','h','j','k','l',';'],
    color: 'text-primary border-primary',
    bg: 'bg-primary',
  },
  bottom: {
    label: 'Bottom Row',
    short: 'ZXCV…',
    keys: ['z','x','c','v','b','n','m'],
    color: 'text-orange-400 border-orange-400',
    bg: 'bg-orange-400',
  },
  all: {
    label: 'All Rows',
    short: 'Mixed',
    keys: [
      '1','2','3','4','5','6','7','8','9','0',
      'q','w','e','r','t','y','u','i','o','p',
      'a','s','d','f','g','h','j','k','l',';',
      'z','x','c','v','b','n','m',
    ],
    color: 'text-green-400 border-green-400',
    bg: 'bg-green-400',
  },
} as const;

type RowId = keyof typeof ROWS;

// All physical rows shown in the keyboard visual
const KEYBOARD_ROWS: { id: RowId | null; keys: string[] }[] = [
  { id: 'number', keys: ['1','2','3','4','5','6','7','8','9','0'] },
  { id: 'top',    keys: ['q','w','e','r','t','y','u','i','o','p'] },
  { id: 'home',   keys: ['a','s','d','f','g','h','j','k','l',';'] },
  { id: 'bottom', keys: ['z','x','c','v','b','n','m'] },
];

function label(k: string) { return k === ';' ? ';' : k.toUpperCase(); }

type GameState = 'idle' | 'playing' | 'finished';

export default function HomeRowHero() {
  const [state, setState] = useState<GameState>('idle');
  const [activeRow, setActiveRow] = useState<RowId>('home');
  const [target, setTarget] = useState('');
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lastKey, setLastKey] = useState('');

  const pool: readonly string[] = ROWS[activeRow].keys;

  const nextKey = useCallback((currentPool: readonly string[]) => {
    return currentPool[Math.floor(Math.random() * currentPool.length)];
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setErrors(0);
    setTimeLeft(45);
    setFeedback(null);
    setLastKey('');
    setTarget(nextKey(ROWS[activeRow].keys));
    setState('playing');
  }, [activeRow, nextKey]);

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

  useEffect(() => {
    if (state !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setLastKey(key);
      if (key === target) {
        setScore((s) => s + 1);
        setFeedback('correct');
        setTarget(nextKey(pool));
      } else if (pool.includes(key)) {
        setErrors((er) => er + 1);
        setFeedback('wrong');
      }
      setTimeout(() => setFeedback(null), 280);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, target, pool, nextKey]);

  const accuracy = score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 100;
  const activeRowColor = ROWS[activeRow].color;

  return (
    <div className="flex flex-col gap-4">

      {/* Row selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ROWS) as RowId[]).map((id) => {
          const row = ROWS[id];
          const isActive = activeRow === id;
          return (
            <button
              key={id}
              onClick={() => { if (state !== 'playing') setActiveRow(id); }}
              disabled={state === 'playing'}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200',
                isActive
                  ? `border-2 ${row.color} bg-current/10 text-foreground`
                  : 'border-border bg-card text-foreground/50 hover:border-primary/40 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              style={isActive ? { borderColor: 'currentColor' } : undefined}
            >
              <span className={isActive ? row.color.split(' ')[0] : ''}>{row.label}</span>
              <span className="ml-1.5 opacity-50">{row.short}</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Time', value: `${timeLeft}s`, hi: timeLeft <= 10 && state === 'playing' },
          { label: 'Score', value: score, hi: false },
          { label: 'Errors', value: errors, hi: errors > 0 },
          { label: 'Accuracy', value: `${accuracy}%`, hi: false },
        ].map((s) => (
          <div key={s.label} className={cn('p-3 rounded-xl border bg-card text-center', s.hi ? 'border-red-500/50' : 'border-border')}>
            <div className={cn('text-2xl font-bold', s.hi ? 'text-red-400' : 'text-primary')}>{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Target key display */}
      <div className="flex items-center justify-center min-h-[140px] rounded-2xl border border-border bg-card">
        {state === 'idle' && (
          <div className="text-center space-y-1">
            <Home className="w-8 h-8 mx-auto text-border mb-2" />
            <p className="text-foreground/30 italic text-sm">Select a row, then press Play</p>
          </div>
        )}
        {state === 'finished' && (
          <div className="text-center space-y-1">
            <Home className="w-10 h-10 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold text-foreground">{score}</p>
            <p className="text-foreground/60 text-sm">keys hit · {accuracy}% accuracy</p>
          </div>
        )}
        {state === 'playing' && (
          <div className="text-center">
            <p className="text-xs text-foreground/40 mb-3 uppercase tracking-widest">Press this key</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={target}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 0.13 }}
                className={cn(
                  'w-24 h-24 rounded-2xl border-2 flex items-center justify-center text-5xl font-bold font-mono mx-auto transition-colors duration-100',
                  feedback === 'correct'
                    ? 'border-green-400 bg-green-400/10 text-green-400'
                    : feedback === 'wrong'
                    ? 'border-red-400 bg-red-400/10 text-red-400'
                    : `${activeRowColor} bg-current/10`
                )}
              >
                {label(target)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Full keyboard visual */}
      {state !== 'idle' && (
        <div className="flex flex-col gap-1.5 items-center p-3 rounded-2xl border border-border bg-card">
          {KEYBOARD_ROWS.map((row) => {
            const isActiveRow = activeRow === 'all' || row.id === activeRow;
            const rowDef = row.id ? ROWS[row.id] : null;
            return (
              <div key={row.id} className="flex gap-1">
                {row.keys.map((k) => {
                  const isTarget = k === target && state === 'playing';
                  const isLastCorrect = k === lastKey && feedback === 'correct';
                  const isLastWrong = k === lastKey && feedback === 'wrong';
                  return (
                    <div
                      key={k}
                      className={cn(
                        'flex items-center justify-center rounded-md border font-mono font-semibold transition-all duration-100',
                        k === ';' ? 'w-9 text-xs' : 'w-8 text-xs',
                        'h-8',
                        isTarget
                          ? `border-2 text-background scale-110 ${rowDef?.bg ?? 'bg-primary'}`
                          : isLastCorrect
                          ? 'border-green-400 bg-green-400/20 text-green-400'
                          : isLastWrong
                          ? 'border-red-400 bg-red-400/20 text-red-400'
                          : isActiveRow
                          ? `border-border/80 text-foreground/70 bg-accent/30`
                          : 'border-border/30 text-foreground/25 bg-transparent'
                      )}
                    >
                      {label(k)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
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
