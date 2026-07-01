'use client';

import { motion } from 'framer-motion';
import type { KeyboardType } from '@/contexts/KeyboardTypeContext';

const KEYBOARD_LABELS: Record<KeyboardType, string> = {
  'asus-ux370uar': 'Asus UX370UAR',
  'dell-latitude-5300-2-in-1': 'Dell Latitude 5300',
  'dell-latitude-e7270': 'Dell Latitude E7270',
  'hp-elitebook-820-g4': 'HP EliteBook 820 G4',
  'toshiba-portege-x30-e': 'Toshiba Portege X30 E',
  'pc': 'PC (Full-size)',
};

const KEY_ROWS = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Enter'],
  ['Ctrl', 'Fn', 'Win', 'Alt', 'Space', 'Alt', 'Ctrl'],
];

interface KeyboardLoaderProps {
  keyboardType?: KeyboardType;
  isSwitching?: boolean;
}

export default function KeyboardLoader({ keyboardType, isSwitching }: KeyboardLoaderProps) {
  const label = keyboardType ? KEYBOARD_LABELS[keyboardType] : 'keyboard';
  const statusText = isSwitching ? `Switching to ${label}` : `Loading ${label}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 sm:gap-6 bg-card/70 backdrop-blur-md rounded-xl overflow-hidden"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 60%, hsl(var(--primary) / 0.18) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="relative flex flex-col items-center gap-3 sm:gap-4 px-4"
      >
        <div className="flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4 rounded-xl border border-border/60 bg-background/50 shadow-lg shadow-primary/5">
          {KEY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-0.5 sm:gap-1 justify-center">
              {row.map((key, keyIndex) => (
                <motion.div
                  key={`${rowIndex}-${keyIndex}`}
                  className="flex items-center justify-center rounded-[3px] sm:rounded border border-border/50 bg-muted/80 text-muted-foreground font-mono select-none"
                  style={{
                    minWidth: key.length > 3 ? '2.75rem' : key.length > 1 ? '1.75rem' : '1.25rem',
                    height: '1.25rem',
                    fontSize: key.length > 3 ? '0.45rem' : '0.55rem',
                    padding: key.length > 3 ? '0 0.25rem' : undefined,
                  }}
                  animate={{
                    opacity: [0.35, 1, 0.35],
                    scale: [0.92, 1, 0.92],
                    borderColor: [
                      'hsl(var(--border) / 0.5)',
                      'hsl(var(--primary) / 0.6)',
                      'hsl(var(--border) / 0.5)',
                    ],
                    backgroundColor: [
                      'hsl(var(--muted) / 0.8)',
                      'hsl(var(--primary) / 0.15)',
                      'hsl(var(--muted) / 0.8)',
                    ],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: (rowIndex * 0.12) + (keyIndex * 0.06),
                    ease: 'easeInOut',
                  }}
                >
                  {key}
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
          </div>

          <p className="text-sm sm:text-base font-medium text-foreground/90 tracking-tight">
            {statusText}
          </p>
          <p className="text-xs text-muted-foreground">Preparing 3D model…</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
