import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { sampleKeyboardQuiz, getKeyboardQuizQuestions } from '@/lib/content';
import type { McqQuestion } from '@/lib/content';

type Question = McqQuestion;

type GameState = 'idle' | 'playing' | 'finished';

export default function KeyboardQuiz() {
  const [state, setState] = useState<GameState>('idle');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [shuffled, setShuffled] = useState<Question[]>([]);

  const start = useCallback(() => {
    const qs = sampleKeyboardQuiz(15);
    setShuffled(qs);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswers([]);
    setState('playing');
  }, []);

  const choose = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === shuffled[current].answer;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, idx]);
  };

  const next = () => {
    if (current + 1 >= shuffled.length) {
      setState('finished');
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const q = shuffled[current];
  const isLast = current + 1 >= shuffled.length;

  return (
    <div className="flex flex-col gap-4">
      {state === 'idle' && (
        <div className="flex flex-col items-center justify-center min-h-[280px] rounded-2xl border border-border bg-card gap-4">
          <HelpCircle className="w-16 h-16 text-border" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">15 Questions</h3>
            <p className="text-foreground/50 text-sm mt-1">
              Pool of {getKeyboardQuizQuestions().length}+ keyboard questions — new set every round
            </p>
          </div>
        </div>
      )}

      {state === 'playing' && q && (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/50">Question {current + 1} / {shuffled.length}</span>
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((current + 1) / shuffled.length) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-primary">{score} pts</span>
          </div>

          {/* Question */}
          <div className="p-5 rounded-2xl border border-border bg-card">
            <p className="text-foreground font-medium text-base leading-relaxed">{q.q}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === q.answer;
              const isWrong = isSelected && !isCorrect;
              return (
                <motion.button
                  key={i}
                  onClick={() => choose(i)}
                  whileHover={selected === null ? { scale: 1.01 } : {}}
                  whileTap={selected === null ? { scale: 0.99 } : {}}
                  className={cn(
                    'p-4 rounded-xl border text-left text-sm font-medium transition-all',
                    selected === null
                      ? 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent cursor-pointer'
                      : isCorrect
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : isWrong
                      ? 'border-red-400 bg-red-400/10 text-red-400'
                      : 'border-border bg-card text-foreground/50 cursor-default'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {selected !== null && isCorrect && <CheckCircle className="w-4 h-4 ml-auto text-green-400" />}
                    {isWrong && <XCircle className="w-4 h-4 ml-auto text-red-400" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {selected !== null && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-4 rounded-xl border text-sm',
                  selected === q.answer ? 'border-green-400/30 bg-green-400/5 text-green-400/80' : 'border-red-400/30 bg-red-400/5 text-red-400/80'
                )}
              >
                {q.explanation}
              </motion.div>
            )}
          </AnimatePresence>

          {selected !== null && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={next}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-primary text-background font-semibold text-sm w-fit hover:bg-primary/90 transition-all"
            >
              {isLast ? 'See Results' : 'Next →'}
            </motion.button>
          )}
        </>
      )}

      {state === 'finished' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 text-center space-y-3">
            <HelpCircle className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-3xl font-bold text-foreground">{score} / {shuffled.length}</h3>
            <p className="text-foreground/60">
              {score >= 9 ? 'Excellent! You\'re a keyboard expert!' : score >= 7 ? 'Great job!' : score >= 5 ? 'Not bad!' : 'Keep studying!'}
            </p>
          </div>
          {/* Answer review */}
          <div className="space-y-2">
            {shuffled.map((question, i) => (
              <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl border text-sm', answers[i] === question.answer ? 'border-green-400/20 bg-green-400/5' : 'border-red-400/20 bg-red-400/5')}>
                {answers[i] === question.answer ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                <span className="text-foreground/80">{question.q}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {(state === 'idle' || state === 'finished') && (
        <motion.button
          onClick={start}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background font-semibold text-sm w-fit hover:bg-primary/90 transition-all"
        >
          {state === 'idle' ? <><Play className="w-4 h-4" />Start Quiz</> : <><RotateCcw className="w-4 h-4" />Play Again</>}
        </motion.button>
      )}
    </div>
  );
}
