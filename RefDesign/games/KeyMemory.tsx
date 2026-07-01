import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Brain, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const POOL = ['A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'];

type Phase = 'idle' | 'showing' | 'inputting' | 'correct' | 'wrong' | 'finished';

export default function KeyMemory() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<string[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [inputIdx, setInputIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const start = useCallback(() => {
    const first = POOL[Math.floor(Math.random() * POOL.length)];
    setSequence([first]);
    setLives(3);
    setRound(1);
    setInputIdx(0);
    setPhase('showing');
  }, []);

  // Show sequence step by step
  useEffect(() => {
    if (phase !== 'showing') return;
    setShowIdx(-1);
    let i = 0;
    const interval = setInterval(() => {
      setShowIdx(i);
      i++;
      if (i >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => { setShowIdx(-1); setInputIdx(0); setPhase('inputting'); }, 500);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [phase, sequence]);

  // Key input
  useEffect(() => {
    if (phase !== 'inputting') return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (!POOL.includes(key)) return;
      const expected = sequence[inputIdx];
      if (key === expected) {
        setFlash('correct');
        setTimeout(() => setFlash(null), 250);
        if (inputIdx + 1 === sequence.length) {
          // Completed round
          const newRound = round + 1;
          setRound(newRound);
          setBestRound((b) => Math.max(b, round));
          setPhase('correct');
          const next = [...sequence, POOL[Math.floor(Math.random() * POOL.length)]];
          setTimeout(() => {
            setSequence(next);
            setInputIdx(0);
            setPhase('showing');
          }, 700);
        } else {
          setInputIdx((i) => i + 1);
        }
      } else {
        setFlash('wrong');
        setTimeout(() => setFlash(null), 400);
        setLives((l) => {
          if (l - 1 <= 0) { setPhase('finished'); return 0; }
          return l - 1;
        });
        setPhase('wrong');
        setTimeout(() => { setInputIdx(0); setPhase('showing'); }, 800);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, sequence, inputIdx, round]);

  const statusMsg =
    phase === 'idle' ? 'Memorize and repeat the key sequence!'
    : phase === 'showing' ? `Watch the sequence (${sequence.length} key${sequence.length !== 1 ? 's' : ''})`
    : phase === 'inputting' ? `Enter key ${inputIdx + 1} of ${sequence.length}`
    : phase === 'correct' ? '✓ Correct! Next round…'
    : phase === 'wrong' ? '✗ Wrong key! Replaying…'
    : `Game Over — You reached round ${round}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{round}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Round</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{bestRound}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Best</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            {[1, 2, 3].map((i) => (
              <Heart key={i} className={cn('w-4 h-4', i <= lives ? 'text-red-400 fill-red-400' : 'text-border')} />
            ))}
          </div>
          <div className="text-xs text-foreground/50">Lives</div>
        </div>
      </div>

      {/* Status */}
      <div className={cn(
        'px-4 py-2 rounded-xl text-sm font-medium text-center transition-colors',
        flash === 'correct' ? 'bg-green-400/20 text-green-400 border border-green-400/30'
        : flash === 'wrong' ? 'bg-red-400/20 text-red-400 border border-red-400/30'
        : 'bg-card border border-border text-foreground/60'
      )}>
        {statusMsg}
      </div>

      {/* Sequence display */}
      <div className="min-h-[120px] p-4 rounded-2xl border border-border bg-card flex items-center justify-center">
        {phase === 'idle' ? (
          <div className="text-center space-y-2">
            <Brain className="w-10 h-10 mx-auto text-border" />
            <p className="text-foreground/30 text-sm">Repeat the growing sequence in order</p>
          </div>
        ) : phase === 'finished' ? (
          <div className="text-center space-y-2">
            <Brain className="w-10 h-10 mx-auto text-primary" />
            <p className="text-2xl font-bold text-foreground">Round {round}</p>
            <p className="text-foreground/60 text-sm">sequence of {sequence.length - 1} keys</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sequence.map((key, i) => (
              <div
                key={i}
                className={cn(
                  'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-all duration-200',
                  phase === 'showing' && showIdx === i
                    ? 'border-primary bg-primary text-background scale-110'
                    : phase === 'inputting' && i < inputIdx
                    ? 'border-green-400/60 bg-green-400/10 text-green-400'
                    : phase === 'inputting' && i === inputIdx
                    ? 'border-primary/60 bg-primary/10 text-primary animate-pulse'
                    : 'border-border bg-card/50 text-foreground/30'
                )}
              >
                {phase === 'showing' && showIdx >= i ? key
                : phase === 'inputting' && i < inputIdx ? key
                : '?'}
              </div>
            ))}
          </div>
        )}
      </div>

      <motion.button
        onClick={start}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm w-fit transition-all',
          phase === 'idle' || phase === 'finished'
            ? 'bg-primary text-background hover:bg-primary/90'
            : 'border border-border bg-card text-foreground hover:bg-accent opacity-50 cursor-not-allowed'
        )}
        disabled={phase !== 'idle' && phase !== 'finished'}
      >
        {phase === 'idle' ? <><Play className="w-4 h-4" />Play</> : phase === 'finished' ? <><RotateCcw className="w-4 h-4" />Play Again</> : <><Brain className="w-4 h-4" />In Progress…</>}
      </motion.button>
    </div>
  );
}
