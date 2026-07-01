import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hand, Trophy } from 'lucide-react';

export default function NKeyRollover() {
  const [heldKeys, setHeldKeys] = useState<Set<string>>(new Set());
  const [maxKeys, setMaxKeys] = useState(0);
  const [allTimeMax, setAllTimeMax] = useState(0);
  const [recording, setRecording] = useState(false);
  const [snapshots, setSnapshots] = useState<number[]>([]);

  useEffect(() => {
    if (!recording) return;
    const pressed = new Set<string>();

    const onDown = (e: KeyboardEvent) => {
      pressed.add(e.code);
      const snap = pressed.size;
      setHeldKeys(new Set(pressed));
      setMaxKeys((m) => {
        const next = Math.max(m, snap);
        setAllTimeMax((at) => Math.max(at, next));
        return next;
      });
    };

    const onUp = (e: KeyboardEvent) => {
      pressed.delete(e.code);
      setHeldKeys(new Set(pressed));
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [recording]);

  const start = () => {
    setHeldKeys(new Set());
    setMaxKeys(0);
    setSnapshots([]);
    setRecording(true);
  };

  const stop = () => {
    setRecording(false);
    setSnapshots((s) => [...s, maxKeys]);
  };

  const keyLabel = (code: string) => {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code === 'Space') return 'SPC';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
    if (code === 'MetaLeft' || code === 'MetaRight') return 'Meta';
    return code.slice(0, 4);
  };

  const held = [...heldKeys];

  return (
    <div className="flex flex-col gap-4">
      {/* Max simultaneous */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{heldKeys.size}</div>
          <div className="text-xs text-foreground/50 mt-0.5">Currently Held</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{maxKeys}</div>
          <div className="text-xs text-foreground/50 mt-0.5">This Session</div>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <div className="text-2xl font-bold text-primary">{allTimeMax}</div>
          <div className="text-xs text-foreground/50 mt-0.5">All-Time Max</div>
        </div>
      </div>

      {/* Key display */}
      <div className="min-h-[200px] rounded-2xl border border-border bg-card p-4 flex flex-col">
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 content-center">
          {recording ? (
            held.length === 0 ? (
              <p className="text-foreground/30 text-sm italic">Hold as many keys as you can…</p>
            ) : (
              held.map((code) => (
                <motion.div
                  key={code}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="min-w-[44px] h-11 px-2 rounded-xl border-2 border-primary bg-primary/15 flex items-center justify-center text-sm font-bold font-mono text-primary"
                >
                  {keyLabel(code)}
                </motion.div>
              ))
            )
          ) : (
            <div className="text-center space-y-3">
              {allTimeMax > 0 ? (
                <>
                  <Trophy className="w-10 h-10 mx-auto text-yellow-400" />
                  <p className="text-3xl font-bold text-foreground">{allTimeMax}</p>
                  <p className="text-foreground/60 text-sm">maximum keys held simultaneously</p>
                  {snapshots.length > 0 && (
                    <div className="flex gap-2 justify-center flex-wrap mt-2">
                      {snapshots.map((s, i) => (
                        <span key={i} className="px-3 py-1 rounded-full border border-border text-xs text-foreground/60">
                          Try {i + 1}: {s}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Hand className="w-12 h-12 mx-auto text-border" />
                  <p className="text-foreground/30 text-sm">Click Start and hold as many keys as possible!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bar indicator */}
      {recording && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-foreground/40">
            <span>Keys held</span>
            <span className="font-bold text-primary">{heldKeys.size}</span>
          </div>
          <div className="h-4 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${Math.min((heldKeys.size / 20) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!recording ? (
          <motion.button
            onClick={start}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            <Hand className="w-4 h-4" />
            {allTimeMax > 0 ? 'Try Again' : 'Start'}
          </motion.button>
        ) : (
          <motion.button
            onClick={stop}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-accent transition-all"
          >
            Stop & Record
          </motion.button>
        )}
      </div>

      <p className="text-xs text-foreground/30 leading-relaxed">
        N-Key Rollover (NKRO) refers to a keyboard's ability to correctly register multiple simultaneous keypresses. Hold as many keys as you can at once to test your keyboard's rollover capability. Most gaming keyboards support 6-key or full NKRO.
      </p>
    </div>
  );
}
