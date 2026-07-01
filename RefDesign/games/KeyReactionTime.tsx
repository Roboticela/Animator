import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROUNDS = 10;

type Phase = 'idle' | 'waiting' | 'ready' | 'finished';

export default function KeyReactionTime() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [targetKey, setTargetKey] = useState('');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [earlyPress, setEarlyPress] = useState(false);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNextKey = useCallback(() => {
    const delay = 1500 + Math.random() * 2000;
    setEarlyPress(false);
    setPhase('waiting');
    waitTimerRef.current = setTimeout(() => {
      const key = KEYS[Math.floor(Math.random() * KEYS.length)];
      setTargetKey(key);
      setStartTime(Date.now());
      setPhase('ready');
    }, delay);
  }, []);

  const start = useCallback(() => {
    setTimes([]);
    setRound(1);
    setLastTime(null);
    setEarlyPress(false);
    showNextKey();
  }, [showNextKey]);

  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (phase === 'waiting') {
        // Early press
        setEarlyPress(true);
        if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
        setTimeout(() => showNextKey(), 1000);
        return;
      }
      if (phase === 'ready' && key === targetKey) {
        const elapsed = Date.now() - startTime;
        setLastTime(elapsed);
        setTimes((t) => {
          const next = [...t, elapsed];
          if (next.length >= ROUNDS) {
            setPhase('finished');
          } else {
            setRound(next.length + 1);
            setTimeout(() => showNextKey(), 800);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, targetKey, startTime, showNextKey]);

  useEffect(() => {
    return () => { if (waitTimerRef.current) clearTimeout(waitTimerRef.current); };
  }, []);

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best = times.length > 0 ? Math.min(...times) : 0;
  const grade = avg < 200 ? 'Exceptional' : avg < 300 ? 'Excellent' : avg < 400 ? 'Good' : avg < 500 ? 'Average' : 'Keep practicing!';

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{phase === 'idle' ? '—' : phase === 'finished' ? `${avg}ms` : lastTime ? `${lastTime}ms` : '—'}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Last / Avg</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{best > 0 ? `${best}ms` : '—'}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Best</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{phase === 'idle' ? '—' : `${times.length}/${ROUNDS}`}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Round</div>
        </div>
      </div>

      {/* Main area */}
      <div className={cn(
        'min-h-[220px] rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all duration-200',
        phase === 'ready' ? 'border-primary bg-primary/5' : phase === 'waiting' ? 'border-border bg-card' : 'border-border bg-card'
      )}>
        {phase === 'idle' && (
          <div className="text-center space-y-2">
            <Timer className="w-12 h-12 mx-auto text-border" />
            <p className="text-foreground/30 text-sm">Wait for the key — then press it immediately!</p>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="text-center space-y-2">
            {earlyPress ? (
              <>
                <p className="text-red-400 font-semibold">Too early! Wait for the key…</p>
                <p className="text-foreground/40 text-sm">Don't press until you see the key!</p>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-primary animate-spin mx-auto" />
                <p className="text-foreground/40 text-sm">Get ready…</p>
              </>
            )}
          </div>
        )}

        {phase === 'ready' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={targetKey + round}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="text-center space-y-2"
            >
              <p className="text-sm text-foreground/50">Press this key!</p>
              <div className="w-28 h-28 rounded-2xl border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-5xl font-bold font-mono text-primary">{targetKey}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {phase === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
            <Timer className="w-12 h-12 mx-auto text-primary" />
            <p className="text-3xl font-bold text-foreground">{avg}ms</p>
            <p className="text-foreground/60 text-sm">Average · Best: {best}ms</p>
            <p className="text-primary font-medium">{grade}</p>
          </motion.div>
        )}
      </div>

      {/* Mini results */}
      {times.length > 0 && phase !== 'idle' && (
        <div className="flex gap-2 flex-wrap">
          {times.map((t, i) => (
            <div key={i} className={cn('px-2 py-1 rounded-lg border text-xs font-mono', t === best ? 'border-green-400/60 bg-green-400/10 text-green-400' : t > avg * 1.3 ? 'border-red-400/40 bg-red-400/5 text-red-400/80' : 'border-border bg-card text-foreground/60')}>
              {t}ms
            </div>
          ))}
        </div>
      )}

      <motion.button
        onClick={start}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-fit transition-all',
          phase === 'idle' || phase === 'finished' ? 'bg-primary text-background hover:bg-primary/90' : 'border border-border bg-card text-foreground/50 cursor-not-allowed'
        )}
        disabled={phase === 'waiting' || phase === 'ready'}
      >
        {phase === 'idle' ? <><Play className="w-4 h-4" />Start</> : phase === 'finished' ? <><RotateCcw className="w-4 h-4" />Play Again</> : <><Timer className="w-4 h-4" />In Progress…</>}
      </motion.button>
    </div>
  );
}
