import {
  Gauge,
  Zap,
  Target,
  Home,
  FileText,
  Flag,
  Star,
  Brain,
  Hash,
  HelpCircle,
  Command,
  LayoutGrid,
  Layers,
  Timer,
  MapPin,
  Hand,
  Calculator,
  CaseSensitive,
  Eraser,
  type LucideIcon,
} from 'lucide-react';
import * as LucideAll from 'lucide-react';

// Handles icon rename across lucide-react versions
const LucideIcons = LucideAll as unknown as Record<string, LucideIcon>;
const FunctionSquareIcon: LucideIcon =
  LucideIcons['FunctionSquare'] ??
  LucideIcons['SquareFunction'] ??
  Hash;

export interface GameEntry {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: 'typing' | 'quiz' | 'reaction' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard';
}

export const GAMES: GameEntry[] = [
  {
    slug: 'typing-speed-test',
    title: 'Typing Speed Test',
    description: 'Measure your words per minute in a 60-second typing test.',
    icon: Gauge,
    category: 'typing',
    difficulty: 'medium',
  },
  {
    slug: 'word-sprint',
    title: 'Word Sprint',
    description: 'Type as many random words as you can in 30 seconds.',
    icon: Zap,
    category: 'typing',
    difficulty: 'easy',
  },
  {
    slug: 'typing-accuracy',
    title: 'Typing Accuracy',
    description: 'Type a sentence with the highest accuracy — every mistake counts.',
    icon: Target,
    category: 'typing',
    difficulty: 'medium',
  },
  {
    slug: 'row-hero',
    title: 'Row Hero',
    description: 'Practice any keyboard row — number, top, home, or bottom keys.',
    icon: Home,
    category: 'typing',
    difficulty: 'easy',
  },
  {
    slug: 'paragraph-marathon',
    title: 'Paragraph Marathon',
    description: 'Type a full paragraph from start to finish without stopping.',
    icon: FileText,
    category: 'typing',
    difficulty: 'hard',
  },
  {
    slug: 'typing-race',
    title: 'Typing Race',
    description: 'Complete the sentence before the countdown reaches zero.',
    icon: Flag,
    category: 'typing',
    difficulty: 'medium',
  },
  {
    slug: 'typing-stars',
    title: 'Typing Stars',
    description: 'Destroy falling letters by pressing the matching key.',
    icon: Star,
    category: 'reaction',
    difficulty: 'medium',
  },
  {
    slug: 'key-memory',
    title: 'Key Memory',
    description: 'Repeat growing keyboard key sequences in order.',
    icon: Brain,
    category: 'challenge',
    difficulty: 'hard',
  },
  {
    slug: 'symbol-smash',
    title: 'Symbol Smash',
    description: 'Type punctuation and special symbols as fast as you can.',
    icon: Hash,
    category: 'typing',
    difficulty: 'hard',
  },
  {
    slug: 'keyboard-quiz',
    title: 'Keyboard Quiz',
    description: 'Answer multiple-choice questions about keyboard hardware.',
    icon: HelpCircle,
    category: 'quiz',
    difficulty: 'easy',
  },
  {
    slug: 'shortcut-master',
    title: 'Shortcut Master',
    description: 'Identify what each Ctrl, Alt, and Cmd shortcut does.',
    icon: Command,
    category: 'quiz',
    difficulty: 'medium',
  },
  {
    slug: 'layout-quiz',
    title: 'Layout Quiz',
    description: 'Test your knowledge of QWERTY, AZERTY, and other layouts.',
    icon: LayoutGrid,
    category: 'quiz',
    difficulty: 'medium',
  },
  {
    slug: 'function-key-finder',
    title: 'Function Key Finder',
    description: 'Match F1 through F12 to their most common uses.',
    icon: FunctionSquareIcon,
    category: 'quiz',
    difficulty: 'easy',
  },
  {
    slug: 'modifier-mash',
    title: 'Modifier Mash',
    description: 'Press the correct Ctrl, Alt, Shift, or Meta combination.',
    icon: Layers,
    category: 'reaction',
    difficulty: 'medium',
  },
  {
    slug: 'key-reaction-time',
    title: 'Key Reaction Time',
    description: 'Press the shown key as quickly as possible when prompted.',
    icon: Timer,
    category: 'reaction',
    difficulty: 'easy',
  },
  {
    slug: 'key-location-trainer',
    title: 'Key Location Trainer',
    description: 'Press the correct key when a letter appears on screen.',
    icon: MapPin,
    category: 'reaction',
    difficulty: 'easy',
  },
  {
    slug: 'n-key-rollover',
    title: 'N-Key Rollover',
    description: 'Hold as many different keys simultaneously as your keyboard allows.',
    icon: Hand,
    category: 'challenge',
    difficulty: 'easy',
  },
  {
    slug: 'number-pad-speed',
    title: 'Number Pad Speed',
    description: 'Type number sequences quickly using the numpad.',
    icon: Calculator,
    category: 'typing',
    difficulty: 'easy',
  },
  {
    slug: 'shift-challenge',
    title: 'Shift Challenge',
    description: 'Type mixed-case words and shifted symbols correctly.',
    icon: CaseSensitive,
    category: 'typing',
    difficulty: 'hard',
  },
  {
    slug: 'backspace-blitz',
    title: 'Backspace Blitz',
    description: 'Fix highlighted typos using Backspace before time runs out.',
    icon: Eraser,
    category: 'challenge',
    difficulty: 'medium',
  },
];

export const CATEGORY_LABELS: Record<GameEntry['category'], string> = {
  typing: 'Typing',
  quiz: 'Quiz',
  reaction: 'Reaction',
  challenge: 'Challenge',
};

export const DIFFICULTY_COLORS: Record<GameEntry['difficulty'], string> = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
};
