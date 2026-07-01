import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { sampleFunctionKeyQuiz, getFunctionKeyQuestions, type FnQuestion } from '@/lib/content';

type GameState = 'idle' | 'playing' | 'finished';

export default function FunctionKeyFinder() {
  const [state, setState] = useState<GameState>('idle');
  const [questions, setQuestions] = useState<FnQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const start = useCallback(() => {
    setQuestions(sampleFunctionKeyQuiz(15));
    setCurrent(0); setSelected(null); setScore(0); setAnswers([]);
    setState('playing');
  }, []);

  const choose = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === questions[current].correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, opt]);
  };

  const next = () => {
    if (current + 1 >= questions.length) setState('finished');
    else { setCurrent((c) => c + 1); setSelected(null); }
  };

  const q = questions[current];

  return (
    <div className="flex flex-col gap-4">
      {state === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-[280px] rounded-2xl border border-border bg-card gap-4">
          <div className="grid grid-cols-6 gap-2">
            {['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'].map((k) => (
              <div key={k} className="w-10 h-10 rounded-lg border border-border/50 bg-accent/30 flex items-center justify-center text-xs font-mono text-foreground/50">{k}</div>
            ))}
          </div>
          <p className="text-foreground/50 text-sm">
            15 questions from {getFunctionKeyQuestions().length}+ function-key prompts
          </p>
        </div>
      )}

      {state === 'playing' && q && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/50">{current + 1} / {questions.length}</span>
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-primary">{score} pts</span>
          </div>

          <div className="flex flex-col items-center p-6 rounded-2xl border border-border bg-card gap-3">
            <p className="text-sm text-foreground/40">What does this key commonly do?</p>
            <div className="w-20 h-20 rounded-2xl border-2 border-primary/40 bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold font-mono text-primary">{q.key}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isSelected = selected === opt;
              const isCorrect = opt === q.correct;
              const isWrong = isSelected && !isCorrect;
              return (
                <motion.button key={i} onClick={() => choose(opt)} whileHover={selected === null ? { scale: 1.01 } : {}}
                  className={cn('p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2',
                    selected === null ? 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent cursor-pointer'
                    : isCorrect ? 'border-green-400 bg-green-400/10 text-green-400'
                    : isWrong ? 'border-red-400 bg-red-400/10 text-red-400'
                    : 'border-border/50 bg-card text-foreground/40 cursor-default')}>
                  <span className="w-5 h-5 rounded-full border border-current text-xs flex items-center justify-center flex-shrink-0">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {selected !== null && isCorrect && <CheckCircle className="w-4 h-4 ml-auto" />}
                  {isWrong && <XCircle className="w-4 h-4 ml-auto" />}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {selected !== null && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={cn('p-4 rounded-xl border text-sm', selected === q.correct ? 'border-green-400/30 bg-green-400/5 text-green-400/80' : 'border-red-400/30 bg-red-400/5 text-red-400/80')}>
                {q.note}
              </motion.div>
            )}
          </AnimatePresence>

          {selected !== null && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={next} whileHover={{ scale: 1.02 }}
              className="px-5 py-2.5 rounded-xl bg-primary text-background font-semibold text-sm w-fit hover:bg-primary/90 transition-all">
              {current + 1 >= questions.length ? 'See Results' : 'Next →'}
            </motion.button>
          )}
        </>
      )}

      {state === 'finished' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-2">
            <div className="grid grid-cols-6 gap-1 justify-center max-w-xs mx-auto">
              {questions.map((question, i) => (
                <div key={i} className={cn('h-2 rounded-full', answers[i] === question.correct ? 'bg-green-400' : 'bg-red-400')} />
              ))}
            </div>
            <h3 className="text-3xl font-bold text-foreground">{score} / {questions.length}</h3>
            <p className="text-foreground/60">{score === questions.length ? 'Function key master!' : score >= 9 ? 'Almost perfect!' : 'Good effort!'}</p>
          </div>
          <div className="space-y-2">
            {questions.map((question, i) => (
              <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl border text-sm', answers[i] === question.correct ? 'border-green-400/20 bg-green-400/5' : 'border-red-400/20 bg-red-400/5')}>
                {answers[i] === question.correct ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <kbd className="px-2 py-0.5 rounded border border-border font-mono text-xs text-foreground">{question.key}</kbd>
                <span className="text-foreground/70 text-xs">→ {question.correct}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {(state === 'idle' || state === 'finished') && (
        <motion.button onClick={start} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background font-semibold text-sm w-fit hover:bg-primary/90 transition-all">
          {state === 'idle' ? <><Play className="w-4 h-4" />Start</> : <><RotateCcw className="w-4 h-4" />Play Again</>}
        </motion.button>
      )}
    </div>
  );
}
