import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionPool, PASSAGE_POOL } from '@/lib/content';

const paragraphPool = new SessionPool(PASSAGE_POOL);

type GameState = 'idle' | 'playing' | 'finished';

export default function ParagraphMarathon() {
  const [state, setState] = useState<GameState>('idle');
  const [paragraph, setParagraph] = useState('');
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const start = useCallback(() => {
    const p = paragraphPool.next();
    setParagraph(p);
    setTyped('');
    setStartTime(Date.now());
    setElapsed(0);
    setState('playing');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (state !== 'playing') return;
    const val = e.target.value;
    if (val.length > paragraph.length) return;
    setTyped(val);
    if (val === paragraph) {
      const t = Date.now() - startTime;
      setElapsed(t);
      setState('finished');
    }
  };

  const correct = typed.split('').filter((c, i) => c === paragraph[i]).length;
  const errors = typed.length - correct;
  const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
  const progress = paragraph.length > 0 ? Math.round((typed.length / paragraph.length) * 100) : 0;
  const elapsedSec = elapsed > 0 ? (elapsed / 1000).toFixed(1) : '—';
  const wpm = elapsed > 0 ? Math.round((paragraph.split(' ').length / (elapsed / 1000)) * 60) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Progress', value: state === 'idle' ? '—' : `${progress}%` },
          { label: 'Accuracy', value: state === 'idle' ? '—' : `${accuracy}%` },
          { label: 'Errors', value: state === 'idle' ? '—' : errors },
          { label: 'Time', value: state === 'idle' ? '—' : state === 'finished' ? `${elapsedSec}s` : `${((Date.now() - startTime) / 1000).toFixed(0)}s` },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {state !== 'idle' && (
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Paragraph display */}
      <div className="p-4 rounded-2xl border border-border bg-card min-h-[160px] font-mono text-sm leading-relaxed select-none">
        {state === 'idle' ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
            <FileText className="w-10 h-10 text-border" />
            <p className="text-foreground/30 italic">Press Play to receive your paragraph</p>
          </div>
        ) : (
          <p>
            {paragraph.split('').map((char, i) => {
              let cls = 'text-foreground/40';
              if (i < typed.length) {
                cls = typed[i] === char ? 'text-green-400' : 'text-red-400 underline decoration-red-400';
              } else if (i === typed.length) {
                cls = 'border-b-2 border-primary text-foreground';
              }
              return <span key={i} className={cls}>{char}</span>;
            })}
          </p>
        )}
      </div>

      {/* Typing area */}
      {state === 'playing' && (
        <textarea
          ref={textareaRef}
          value={typed}
          onChange={handleInput}
          onPaste={(e) => e.preventDefault()}
          className="w-full p-4 rounded-xl border border-border bg-card text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          rows={5}
          placeholder="Type the paragraph above…"
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
            className="p-5 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              <span className="text-2xl font-bold text-foreground">{elapsedSec}s</span>
            </div>
            <p className="text-foreground/60 text-sm">
              {wpm} WPM · {accuracy}% accuracy · {errors} error{errors !== 1 ? 's' : ''}
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
        {state === 'idle' ? <><Play className="w-4 h-4" />Play</> : <><RotateCcw className="w-4 h-4" />New Paragraph</>}
      </motion.button>
    </div>
  );
}
