import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Calculator, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOTAL_ROUNDS = 10;

function generateSequence(len: number) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
}

type GameState = 'idle' | 'playing' | 'finished';

export default function NumberPadSpeed() {
  const [state, setState] = useState<GameState>('idle');
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState('');
  const [typed, setTyped] = useState('');
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [roundResults, setRoundResults] = useState<boolean[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextRound = useCallback((roundNum: number) => {
    const len = 4 + Math.floor(roundNum / 3); // 4-6 digits
    const seq = generateSequence(len);
    setSequence(seq);
    setTyped('');
    setStartTime(Date.now());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const start = useCallback(() => {
    setRound(1);
    setScore(0);
    setTotalTime(0);
    setFeedback(null);
    setRoundResults([]);
    setState('playing');
    nextRound(1);
  }, [nextRound]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length > sequence.length) return;
    setTyped(val);
    if (val.length === sequence.length) {
      const elapsed = Date.now() - startTime;
      const correct = val === sequence;
      setFeedback(correct ? 'correct' : 'wrong');
      if (correct) setScore((s) => s + 1);
      setTotalTime((t) => t + elapsed);
      setRoundResults((r) => [...r, correct]);
      setTimeout(() => {
        setFeedback(null);
        if (round >= TOTAL_ROUNDS) setState('finished');
        else { setRound((r) => { nextRound(r + 1); return r + 1; }); }
      }, 600);
    }
  };

  const accuracy = score + (roundResults.length - score) > 0 ? Math.round((score / Math.max(roundResults.length, 1)) * 100) : 100;
  const avgTime = roundResults.length > 0 ? Math.round(totalTime / roundResults.length) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{state === 'idle' ? '—' : `${round}/${TOTAL_ROUNDS}`}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Round</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Correct</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{state === 'idle' ? '—' : `${accuracy}%`}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Accuracy</div>
        </div>
      </div>

      {/* Number display */}
      <div className={cn(
        'min-h-[160px] rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all',
        feedback === 'correct' ? 'border-green-400/60 bg-green-400/5'
        : feedback === 'wrong' ? 'border-red-400/60 bg-red-400/5'
        : 'border-border bg-card'
      )}>
        {state === 'idle' && (
          <div className="text-center space-y-2">
            <Calculator className="w-12 h-12 mx-auto text-border" />
            <p className="text-foreground/30 text-sm">Type the number sequence shown</p>
          </div>
        )}

        {state === 'playing' && (
          <>
            <p className="text-xs text-foreground/40 uppercase tracking-widest">Type this sequence</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={sequence}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-1"
              >
                {sequence.split('').map((digit, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-10 h-12 rounded-lg border flex items-center justify-center text-2xl font-bold font-mono transition-all',
                      i < typed.length
                        ? typed[i] === digit ? 'border-green-400 bg-green-400/10 text-green-400' : 'border-red-400 bg-red-400/10 text-red-400'
                        : i === typed.length ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground/60'
                    )}
                  >
                    {digit}
                  </span>
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-2 text-sm font-medium">
              {feedback === 'correct' && <><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-green-400">Correct!</span></>}
              {feedback === 'wrong' && <><XCircle className="w-4 h-4 text-red-400" /><span className="text-red-400">Wrong — expected {sequence}</span></>}
            </div>
          </>
        )}

        {state === 'finished' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-2">
            <Calculator className="w-10 h-10 mx-auto text-primary" />
            <p className="text-3xl font-bold text-foreground">{score}/{TOTAL_ROUNDS}</p>
            <p className="text-foreground/60 text-sm">{accuracy}% accuracy · {avgTime}ms avg</p>
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
          inputMode="numeric"
          className="w-full p-3 rounded-xl border border-border bg-card text-foreground font-mono text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          placeholder="Type numbers…"
          autoComplete="off"
        />
      )}

      {/* Round results dots */}
      {roundResults.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {roundResults.map((ok, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-full', ok ? 'bg-green-400' : 'bg-red-400')} />
          ))}
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
